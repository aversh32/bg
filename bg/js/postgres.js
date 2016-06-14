(function(  ){

    Z.pg = Z.pg || (function(  ){
        var tables = {};
        var pg = require('pg');
        var client,
            connected = false,
            stack = [],
            doneFn,
            connectedFn = function( callback ){
                var args = Array.prototype.slice.call(arguments,1);
                if( connected ){
                    var fn, el;
                    while( el = stack.shift() ){
                        fn = el[0];
                        fn && fn.apply(this, el[1]);
                    }
                    callback && callback.apply(this, args);
                }else
                    stack.push([callback, args]);
            };
        pg.connect( App.cfg.postgres, function(err, clientResult, done) {
            if( err ){
                console.logModule('pg','cannot connect to postgres');
                console.logModule('pg',err);
            }
            client = clientResult;
            doneFn = done;
            client.query("select tablename from pg_tables where schemaname='public';", [],function( err, data ){
                doneFn();
                if( err ){
                    console.logModule('pg','Error reading table list from PG')
                }else{
                    tables = Z.a2o(data.rows.map( Z.getProperty('tablename') ) );
                    connected = true;
                    connectedFn();
                }
            });
        });
        var DBAbstraction = function( cfg ){
            this.scheme = cfg.table;

            var names = this.table = {};
            Z.each(cfg.table, function( name, cfg ){
                names[name] = cfg;
                var i, fields = cfg.fields, field;
                for( i in fields )
                    if( fields.hasOwnProperty(i) ){
                        field = fields[i];
                        field.dbName = Z.fromCamel( i );
                        if( field.primary ){
                            cfg.key = [field.dbName];
                        }
                    }
                if( cfg.key === void 0 ){
                    cfg.key = cfg.index && Z.makeArray(cfg.index[0]).map( Z.fromCamel );
                }

            });
        };
        var dataSetters = {
            'default': function(text){return text;},
            timestamp: function(data){return new Date(data);},
            boolean: function( data ){ return !!data; }
        };
        dataSetters.bigint = dataSetters.bigserial = dataSetters.smallint = dataSetters.int = function( data ){
            return data + '';
        };
        var dataGetters = {
            timestamp: function(data){return +new Date(data);},
            'default': function(text){return text;},
            bigint: function( data ){ return parseInt(data);},
            bigserial: function( data ){ return parseInt(data);},
            smallint: function( data ){ return parseInt(data);},
            int: function( data ){ return parseInt(data);},
            boolean: function( data ){ return data; }
        };

        DBAbstraction.prototype = {
            getAll: function( table, callback ){

            },
            getList: function( table, key, value, callback, assync, limit ){
                var cfg = this.table[table],
                    fields = cfg.fields,
                    where = '', arr = [],
                    setter,
                    field,
                    q, n = 1;
                var mapping = {};
                for( var i in fields )
                    if( fields.hasOwnProperty(i) )
                        mapping[fields[i].dbName] = [
                            i,
                            dataGetters[fields[i].type] ? dataGetters[fields[i].type ]: dataGetters['default']
                        ];
                if( key !== void 0 ){
                    field = fields[key];
                    where = ' where '+ field.dbName +'=$1';
                    setter = dataSetters[field.type] || dataSetters.default;

                    if( Z.isArray( value ) ){
                        where = ' where '+ field.dbName +' in ('+ value.map( function( el ){
                            var o = '$'+n;
                            arr.push(setter(el));
                            n++;
                            return o;
                        } ).join(',') +')';
                    }else{
                        where = ' where '+ field.dbName +'=$'+ n;
                        arr.push(setter(value));
                        n++;
                    }
                }
                var order = '';
                if( cfg.sort ){
                    order+=' ORDER BY ';
                    Z.each(cfg.sort, function( k, v ){
                        order += fields[k].dbName +' '+ v;
                    });
                }
                limit = limit ? ' LIMIT '+ limit : '';
                q = 'SELECT * FROM '+ cfg.name + where + order + limit +';';
                //console.log(q,arr);
                var mapFn = function(el){
                        var obj = {};
                        for( var i in el )
                            if(el.hasOwnProperty(i)){
                                var m = mapping[i];
                                obj[m[0]] = m[1](el[i]);
                            }

                        return obj;
                    };
                if(!assync)
                    pg.connect( App.cfg.postgres, function(err, client, done) {
                        client.query(q, arr, function( err, result ){
                            if(err){
                                console.log('PG:ERR:list', (q+'').substr(0,1000), values, err);
                            }
                            done();
                            result && result.rows && (result.rows = result.rows.map( mapFn ));
                            callback(result && result.rows);

                        });
                    });
                else{
                    pg.connect( App.cfg.postgres, function(err, client, doneFn) {
                        var query = client.query(q, arr);
                        query.on('row', function( row ){
                            callback([mapFn(row)]);
                        });
                        query.on('end', function(  ){
                            doneFn();
                        });
                    });

                }
            },
            _low: function( q, data, callback, assync ){
                if(assync){
                    pg.connect( App.cfg.postgres, function(err, client, doneFn) {
                        var query = client.query(q, data,function(){}),
                            c = 0;
                        query.on('row', function( row ){
                            c++;
                            callback(row);
                        });
                        query.on('end', function(  ){
                            doneFn();
                            typeof assync === 'function' && assync(c);
                        });
                    });
                } else {
                    pg.connect(App.cfg.postgres, function (err, client, doneFn) {
                        client.query(q, data, function (err) {
                            if(err){
                                console.log('PG:ERR:low', q,data, err);
                            }
                            doneFn();
                            callback.apply(client, Z.toArray(arguments));
                        });
                    });
                }
            },
            /*
            result.rows
                .map( db._makeMapper('msg'))
             */
            _makeMapper: function( ){
                var tables = Array.prototype.concat.apply([],Z.toArray(arguments) ),
                    i, _i;
                var mapping = {}, table, cfg, fields, j;
                for( i = 0, _i = tables.length; i < _i; i++ ){
                    table = tables[i];
                    if( typeof table === 'string' ){
                        cfg = this.table[table];
                        fields = cfg.fields;
                    }else{
                        fields = {};
                        for( j in table ){
                            if( table.hasOwnProperty( j ) ){
                                fields[Z.toCamel( j )] = { dbName: j, type: table[ j ] };
                            }
                        }
                    }


                    for( j in fields )
                        if( fields.hasOwnProperty(j) )
                            (mapping[fields[j].dbName] = [j,dataGetters[fields[j].type]?dataGetters[fields[j].type]: dataGetters['default']]);

                }
                return function(el){
                    var obj = {};
                    for( var i in el )
                        if(el.hasOwnProperty(i)){
                            var m = mapping[i];
                            obj[m[0]] = m[1](el[i]);
                        }

                    return obj;
                };
            },
            get: function( table, data, callback, assync ){
                var cfg = this.table[table],
                    fields = cfg.fields,
					
                    values = [],
                    n = 1,
                    i, where;
                if(typeof data === 'object' && Z.isArray(data) === false){
                    where = [];
                    for( i in data ) if( data.hasOwnProperty(i) ){
                        where.push( '"'+ fields[i].dbName+'"=$'+n );
                        var setter = dataSetters[fields[i].type] || dataSetters['default'];
                        values.push( setter( data[i] ) );
						
                        n++;
                    }
                    where = ' WHERE '+where.join(' AND ');
                }else{
                    data = Z.makeArray( data );
                    where = cfg.key ? ' WHERE ' + cfg.key.map( function( el, i ){
                        var q;
                        if( Z.isArray( data[i] ) ){
                            q = el + ' in (' + data[i].map( function( el ){
                                var o = '$' + n;
                                var setter = dataSetters[fields[el].type] || dataSetters['default'];
                                values.push( setter( data[i] ) );
								//console.log("SETTER     "+setter);
								//console.log("VALUES     "+values);
                                n++;
                                return o;
                            } ).join( ',' ) + ')';

                        }else{
                            q = el + '=$' + n;
                            var setter = dataSetters[fields[el].type] || dataSetters['default'];
                            values.push( setter( data[i] ) );
								//console.log("SETTER     "+setter);
								//console.log("VALUES     "+values);
                            n++;
                        }
						//console.dir("Значения          "+values);
                        return q;

                    } ).join( ' AND ' ) : '';
                }
				
                var q = 'SELECT * from '+ cfg.name +where;
                var mapping = {};
                for( var i in fields )
				{
                    fields.hasOwnProperty(i) &&
                        (mapping[fields[i].dbName] = [i,dataGetters[fields[i].type]?dataGetters[fields[i].type]: dataGetters['default']]);
						//console.log("mapping[fields[i].dbName]");
						//console.dir(mapping[fields[i].dbName]);
				}
                pg.connect( App.cfg.postgres, function(err, client, doneFn) {
                    client.query( q, values, function( err, result ){
                        if(err){
                            console.log('PG:ERR:get', q,values, err);
                        }
                        doneFn();

                        if( !err ){
                            result.rows && (result.rows = result.rows.map(function(el){
                                var obj = {};
                                for( var i in el )
                                    if( el.hasOwnProperty(i) ){
                                        var m = mapping[i];
                                        obj[m[0]] = m[1](el[i]);
                                    }
                                return obj;
                            }));
                            callback(result.rows[0]);
                        }
                    });
                });
            },
            remove: function( table, data, callback ){
                var cfg = this.table[table],
                    key;
                if( typeof callback !== 'function' && callback !== void 0 ){
                    key = data;
					/*console.log("Дата");
					console.dir(data);
					console.log("Коллбэк");
					console.dir(callback);
					console.dir(arguments[3]);*/
                    data = callback;
                    callback = arguments[3];
                }else{
                    key = cfg.key;
					/*console.log("Дата");
					console.dir(data);
					console.log("Коллбэк");
					console.dir(callback);
					console.dir(arguments[3]);*/
                }
                var q = 'DELETE from '+ cfg.name +' WHERE '+key+'=$1',
                    fields = cfg.fields;
					/*console.log("Поля              ");
					console.dir(fields);
					console.dir("Запрос              "+q);
					console.dir("Данные              "+data);*/
                pg.connect( App.cfg.postgres, function(err, client, doneFn) {
                    client.query( q, [data], function( err, result ){
                        if(err){
                            console.log('PG:ERR:remove', q,data, err);
                        }
                        doneFn();
                        callback && callback(err, result.rowCount);
                    });
                });
            },
            inc: function( table, id, data, callback ){
                var cfg = this.table[table],
                    fields = cfg.fields,
                    field,
                    i,
                    where,
                    q,
                    setter,
                    error = false,
                    keys = [],
                    values = [],
                    valueHolder = [],
                    n = 1;

                for( i in data ) if(data.hasOwnProperty(i)){
                    field = fields[i];
                    if( !field ){
                        console.logModule('pg','No such field `'+ i +'` in table `'+ table +'`');
                        error = true;
                    }else{
                        setter = dataSetters[ field.type ] || dataSetters.default;
                        keys.push( field.dbName );
                        values.push( setter( data[i] ) );
                        //valueHolder.push( '$'+n );
                        //n++;
                    }
                }
                id = Z.makeArray(id);
                where = cfg.key ? ' WHERE '+ cfg.key.map(function(el,i){

                        var q;
                        if( Z.isArray( id[i] ) ){
                            q =  el +' in ('+ id[i].map( function( el ){
                                var o = '$'+n;
                                values.push(el);
                                n++;
                                return o;
                            } ).join(',') +')';

                        }else{
                            q =  el +'=$' + n;
                            values.push(id[i]);
                            n++;
                        }

                        return q;

                    }).join(' AND ') : '';
                q = 'UPDATE '+ cfg.name  +' SET '+ keys.map(function(el,i){
                        var val = values.splice(0,1)[0];
                        return  el +'='+ el + (val<0?val:(val===0?'':'+'+val));
                    }).join(',') + where +';';
                //console.log(q,values);

                if( error ){
                    console.logModule('pg',q);
                }else{
                    pg.connect( App.cfg.postgres, function(err, client, doneFn) {
                        client.query( q, values, function( err, result ){
                            if(err){
                                console.log('PG:ERR:inc', q,values, err);
                            }
                            doneFn();
                            callback && callback(err, result && result.rowCount);
                        });
                    });
                }
            },
            edit: function( table, id, data, callback ){
                var cfg = this.table[table],
                    fields = cfg.fields,
                    field,
                    i,
                    where,
                    q,
                    setter,
                    error = false,
                    keys = [],
                    values = [],
                    valueHolder = [],
                    n = 1;

                for( i in data ) if(data.hasOwnProperty(i)){
                    field = fields[i];
                    if( !field ){
                        console.logModule('pg','No such field `'+ i +'` in table `'+ table +'`');
                        error = true;
                    }else{
                        setter = dataSetters[ field.type ] || dataSetters.default;
                        keys.push( field.dbName );
                        values.push( setter( data[i] ) );
                        valueHolder.push( '$'+n );
                        n++;
                    }
                }
                id = Z.makeArray(id);
                where = cfg.key ? ' WHERE '+ cfg.key.map(function(el,i){

                        var q;
                        if( Z.isArray( id[i] ) ){
                            q =  el +' in ('+ id[i].map( function( el ){
                                var o = '$'+n;
                                values.push(el);
                                n++;
                                return o;
                            } ).join(',') +')';

                        }else{
                            q =  el +'=$' + n;
                            values.push(id[i]);
                            n++;
                        }

                        return q;

                    }).join(' AND ') : '';
                q = 'UPDATE '+ cfg.name  +' SET '+ keys.map(function(el,i){
                        return  el +'='+ valueHolder[i];
                    }).join(',') + where +';';
                console.log(q,values);

                if( error ){
                    console.logModule('bg',q);
                }else{
                    var debug = this.debug;
                    pg.connect( App.cfg.postgres, function(err, client, doneFn) {
                        if(debug)
                            console.logModule('PG:DEBUG:EDIT', q, values);
                        client.query( q, values, function( err, result ){
                            if(debug)
                                console.logModule('PG:DEBUG:EDIT_RESULT', err, result);
                            if(err){
                                console.log('PG:ERR:edit', q,values, err);
                            }
                            doneFn();
                            callback && callback(err, result && result.rowCount);
                        });
                    });
                }
            },
            add: function( table, data, callback ){
                var cfg = this.table[table],
                    fields = cfg.fields,
                    field,
                    i,
                    addition = cfg.key ? ' RETURNING '+cfg.key.join(',') : '',
                    q,
                    setter,
                    error = false,
                    keys = [],
                    values = [],
                    n = 1;
                data = Z.makeArray(data);
                var vals = [];
                data.forEach( function( data, m ){
                    var valueHolder = [], i;
                    for( i in data ) if(data.hasOwnProperty(i)){
                        field = fields[i];
                        if( !field ){
                            console.logModule('pg','No such field `'+ i +'` in table `'+ table +'`');
                            error = true;
                        }else{
                            setter = dataSetters[ field.type ] || dataSetters.default;
                            m==0 && keys.push( '"'+field.dbName+'"' );
                            values.push( setter( data[i] ) );
                            valueHolder.push( '$'+n );
                            n++;
                        }
                    }
                    vals.push('('+ valueHolder.join(',') +')');
                });

                q = 'INSERT into '+ cfg.name  +' ('+ keys.join(',') +') VALUES'+ vals.join(',')+ addition +';';
                if( error ){
                    console.logModule('pg',q);
                }else{
                    pg.connect( App.cfg.postgres, function(err, client, doneFn) {
                        //debugger;
                        client.query( q, values, function( err, result ){
                            if(err){
                                console.log('PG:ERR:add', q,values, err);
                            }
                            doneFn();
                            callback && callback(err, result && result.rows && result.rows[0]);
                        });
                    });
                }
            }
        };
        Z.observable(DBAbstraction.prototype);
        return {
            use: function( module, fn ){
                if(! App.cfg.module[module] ){
                    throw 'No module `'+ module +'` in cfg';
                }
                var out = new DBAbstraction( App.cfg.module[module] );
                this.check( module, fn, out );
                return out;
            },
            check: function( module, callback, db ){

                var cfg = App.cfg.module[module],
                    fn = function inited(){
                        callback && callback();
                        db.fire('inited');
                    };
                var recreate = cfg.recreate === void 0 ? false : cfg.recreate;
                db = db || new DBAbstraction( cfg );
                connectedFn( function(  ){
                    var counter = 0;
                    Z.each(cfg.table, function( name, data ){
                        var index = data.index = data.index || [];
                        var localRecreate = data.recreate === void 0 ? recreate : data.recreate;
                        counter++;
                        App.action('recreate_'+data.name, 10000, function(  ){
                            counter--;
                            if( localRecreate || !tables[ data.name ] ){
                                counter++;
                                var n = 1, d = [];
                                var q = (!localRecreate ? '' : 'DROP TABLE IF EXISTS ' + data.name + ';') +
                                    ('CREATE TABLE ' + data.name + ' (' +
                                    Z.map( data.fields, function( name, data ){
                                        data.index && index.push( [data.dbName] );


                                        return '"' + data.dbName + '" ' + data.type +
                                            ( data.primary ? ' primary key' : '' ) +
                                            ('value' in data ? ' default \'' + data.value.toString() + '\'' : '');
                                    } ).join( ',' )
                                    + ');');
                                console.logModule('pg', q );
                                //return ;
                                client.query( q, d, function( err, res ){
                                        doneFn();
                                        if( err ){
                                            console.logModule('pg', 'ERROR CREATING TABLE "' + data.name + '"' , q, d, data);
                                            throw err;
                                        }else{
                                            var waiter = Z.wait( function(){

                                                data.init && data.init.length && db.add( name, data.init, function (err, data) {
                                                    console.logModule('pg', 'init insert', name, err, data);
                                                } );
                                            } );
                                            index.forEach( function( el ){
                                                counter++;
                                                el = Z.makeArray( el );
                                                waiter.add();
                                                var q = 'CREATE INDEX "' + data.name + '_' + el.join( '_' ) + '_idx"' + ' ON ' + data.name + ' (' +
                                                    el.map( function( el ){
                                                        return '"' + el + '"'
                                                    } ).join( ',' )
                                                    + ');';
                                                //console.log( q );
                                                client.query(
                                                    q, [], function( err ){
                                                        doneFn();
                                                        waiter.done();

                                                        if( err && err.message.indexOf( 'already exists' ) === -1 ){
                                                            console.logModule('pg', 'ERROR CREATING INDEX' + data.name );
                                                            throw err;
                                                        }else{
                                                            counter--;
                                                            !counter && fn && fn();
                                                            fn = void 0;
                                                        }
                                                    } );
                                            } );
                                            !index.length && waiter._try();
                                            counter--;
                                            if( !counter && fn ){
                                                fn();
                                                fn = void 0;
                                            }
                                        }
                                    }
                                );
                            }
                            if( !counter && fn ){ fn(); fn = void 0; }
                        }, function( ){
                            counter--;
                            if( !counter && fn ){ fn(); fn = void 0; }
                        });

                    });
                    if( !counter && fn ){ fn(); fn = void 0; }
                });
                return db;
            }
        };
    })();
})();