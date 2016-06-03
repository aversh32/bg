var nano = require('nano')('http://'+App.cfg.couch.host);//

var Storage = function( name ){
    this.dbName = name;
    this.db = nano.use( name );
};
Storage.prototype = {
    add: function( data, callback ){
        this.db.insert( data, callback );
    },
    index: function( names, callback ){
        var self = this;
/*
        { "views":
            { "gr":
                { "map": function(doc) { emit(doc.gr, doc); } }
            }
        }, '_design/mmm'*/
        var obj = {views: {}};
        names = Z.makeArray(names);
        names.map( function( name ){
            if( Z.isArray(name) ){
                obj.views[name.join('-')] = {
                    map: eval('(function(doc){emit(['+
                        (name.map( function(name){ return 'doc["'+ name +'"]'; } ).join(', ')) +
                        '],null);})')
                };
                obj.views[name.join('-')+'_count'] = {
                    map: eval('(function(doc){emit(['+
                        (name.map( function(name){ return 'doc["'+ name +'"]'; } ).join(', ')) +
                        '],null);})'),
                    reduce: '_count'
                };

            }else{
                obj.views[name] = {
                    map: eval('(function(doc){emit(doc["'+ name +'"],null);})')
                };
                obj.views[name+'_count'] = {
                    map: eval('(function(doc){emit(doc["'+ name +'"],null);})'),
                    reduce: '_count'
                };
            }
        });
        Z.doAfter( function( callback ){

            self.db.get('_design/_'+ self.dbName, function(err, data){
                if( err ){
                    callback();
                }else{
                    self.remove(data._id, data._rev, callback)
                }

            });
        }, function(  ){
            self.db.insert(obj, '_design/_'+ self.dbName, function( err ){
                console.log(err);
                callback && callback();
            });
        })

    },

    get: function( hashName, hashVal, callback ){
        if( typeof hashVal === 'function' ){
            callback = hashVal;
            if( hashName === void 0 )
                callback(false);
            else
                this.db.get(hashName, function( err, data ){
                    callback(data);
                });
        }else
            this.db.view('_'+this.dbName, hashName, {key: hashVal,include_docs: true}, function( err, data ){
                if( !data ){
                    callback(false);
                    return false;
                }
                data.rows.forEach(function(el){el.value=el.value||el.doc;});
                callback(data.rows.length ? data.rows[0].value : false);
            })
    },
    getAll: function( hashName, callback ){
        this.db.list({include_docs: true},function( err, data ){
            data.rows.forEach(function(el){el.value=el.value||el.doc;});
            callback((data||{rows: []}).rows.map( function( el ){
                return el.doc;
            }));

        })
    },
    getList: function( hashName, hashVal, callback ){
        if( Z.isArray(hashName) ){
            callback = hashVal;

            this.db.fetch({include_docs: true, keys: hashName}, function (err,data) {
                if(!err && data && data.rows)
                    callback(data.rows.filter(function(el){
                        return el && el.doc;
                    }).map(function(el){
                        return el.doc;
                    }));
                else
                    callback([]);
            });
        }else{
            this.db.view('_'+this.dbName, hashName,{key: hashVal, include_docs: true}, function( err, data ){
                try{
                data.rows.forEach(function(el){el.value=el.value||el.doc;});
                callback((data||{rows: []}).rows.map( function( el ){
                    return el.value;
                }));
                }catch(e){
                    debugger;
                }
            });
        }

    },
    getPage: function( hashName, hashVal, page, callback, perPage ){
        perPage = perPage || Z.perPage;
        this.db.view('_'+this.dbName, hashName, {include_docs: true,key: hashVal, limit: perPage, skip: page*perPage, descending: true}, function( err, data ){
            data.rows.forEach(function(el){el.value=el.value||el.doc;});
            callback(data||{rows: []});
        });
    },
    count: function( hashName, hashVal, callback ){
        this.db.view('_'+this.dbName, hashName+'_count', {key: hashVal}, function( err, data ){
            callback((data.rows && data.rows[0] && data.rows[0].value) || 0);
        });
    },
    edit: function( obj, callback ){
        /*var id = obj._id || obj.id;
        delete obj.id;
        delete obj._id;*/
        this.db.insert(obj,obj._id, callback);
    },
    writeRemoved: function( data ){
        // TODO dump anywhere
    },
    remove: function( id, rev, callback ){
        this.db.get(id, function( err, data ){
            this.writeRemoved(data);
            this.db.destroy( id, rev, function( err, body ){
                callback && callback();
            } );
        }.bind(this));

    }
};

var db = GLOBAL.db = {
    dbList: {},
    has: function( name ){
        name = name.toLowerCase();
        return this.dbList[name] === true;
    },
    create: function( name ){
        name = name.toLowerCase();
        nano.db.create(name, function(  ){
            this.fire('dbCreated', name);
            this.fire('dbCreated.'+ name);
        }.bind(this));
    },
    need: function( name, callback ){
        name = name.toLowerCase();
//        nano.db.destroy(name);
//        return;
        if(!this.listLoaded){
            this.on('listLoaded', this.need.bind(this, name, callback));
            return;
        }
        var result = function(isNew){
            var storage = new Storage(name);
            storage.isNew = isNew === true;
            callback( storage );
        };
        if( !db.has(name) ){
            db.create(name);
            db.on('dbCreated.'+ name, result.bind(this, true));
        }else
            result(false);
    }
};

Z.observable(db);


nano.db.list( function( err, list ){
    db.dbList = Z.a2o(list);
    db.listLoaded = true;
    db.fire('listLoaded');

});