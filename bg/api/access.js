var cosher = require('z-redis-cosher');
var cache = new cosher({
    name: 'access-n',
    idKey: 'uid',
    timeout: 240,
    connectCfg: App.cfg.redis,
    preQuery: function( callback ){
        Z.doAfter( function( callback ){
            if(roled)
                callback();
            else
                db.getList( 'role', void 0, void 0, function( list ){
                    Role = Z.makeHash( list, 'name' );
                    roled = true;
					console.log("Загрузка ролей из редис");
					console.dir(Role);
                    callback();
                } );
        }, function( callback ){
            if(righted)
                callback();
            else
                db.getList( 'right', void 0, void 0, function( list ){
                    right = Z.makeHash( list, 'rid', function(el, last){ return (last || []).concat(el); } );
                    righted = true;
					console.log("Загрузка прав из редис");
					console.dir(right);
                    callback();
                } );
        }, callback );
    },
    query: function( id, cb ){

        db.getList( 'access', 'uid', id, function( list ){
            cb(expand( list ));
        } );

    }
});
console.log("cache");
			console.dir(cache);
var Role,
    right,
    rightLoader = Z.wait();

var db = Z.pg.use('rights');
var populateRole = function( rid, can ){
    can = can || {};
    (right[rid]||[]).forEach( function( el ){
        if( el.type === 1 ){
            var role = Role[el.action];
            if(!role)
                throw 'Role `'+ el.action +'` is not defined';
            populateRole( role.rid, can );
        }else
            can[ el.action ] = true;
    });
    return can;
};
var typeMap = {
    system: 1,
    project: 2,
    wallet: 3,
    company: 4
},
    typeMapHash = {1: 'system', 2: 'project', 3: 'wallet', 4: 'company'};

var expand = function( list ){
    var instanceHash, typeHash, hash = {
        instance: instanceHash = {},
        type: typeHash = {}
    },
        el, i, _i, rights;

    for( i = 0, _i = list.length; i < _i; i++ ){
        el = list[ i ];
        if( (rights = instanceHash[el.iid] ) === void 0 )
            rights = instanceHash[el.iid] = {};
        typeHash[el.type] = typeHash[el.type] || {};
        typeHash[el.type][el.iid] = rights;
        Z.apply( rights, populateRole( el.rid ) );
    }
    return hash;
};
var roled = false, righted = false;
var getRights = function( uid, callback ){

};
exports = module.exports = {
    getAvaliable: function( hash, user, util ){
        //console.log('#1');
        var pages = ['profile'/*,'stats'/*,'payout'*/,'projects','companies','contacts'];
        if( user._id === 'USERNAME' ){
            pages.push('collaboration');
        }
        return pages;
    },
    getRoles: function () {
        return Role;
    },
    getRights: function () {
        return right;
    },
    can: function( u, uid, instance, type, action, util ){
        //if(action === 'prooject.viewBalance')debugger;
        u && (uid = App.realUser(u));

        cache.get(uid, function( err, cached ){
            if(!cached)
                return util.error('noAccess');
            type = type || 'project';
            //if(type==='system')debugger;
            if( typeMap[type] === void 0 )
                return util.error('incorrectType');

            if(instance===void 0)
                instance = '*';
			console.log("cached1");
			console.dir(cached);
            var rights = cached.instance && cached.instance[instance] || {},
                typeRights = cached.type && cached.type[typeMap[type]];
            typeRights && typeRights['*'] && Z.apply( rights, typeRights['*'] );
            if( !instance ){
                return util.ok(rights);
            }
            var can = !!rights[action] || uid === 'USERNAME';
            !can && console.green([uid, instance, type, action,'=>', can, App.action.unique].join(' '));
            return util.ok( can );
        } );

        return util.wait;
    },
    byType: function (u, uid, type, action, util) {
        u && (uid = App.realUser(u));
        cache.get(uid, function( err, cached ){
            if(!cached)
                return util.error('noAccess');
            type = type || 'project';

            if( typeMap[type] === void 0 )
                return util.error('incorrectType');
            if(!cached || !cached.type || !typeMap)
                return util.ok([]);

            var rights = cached.instance || {},
                typeRights = cached.type[typeMap[type]];

            var out = [];
			console.log("cached");
			console.dir(cached);
            if(typeRights && typeRights['*']){
                out = '*';/*
                for(var i in rights){
                    if( rights.hasOwnProperty(i) && i !== '*'){
                        if(cached.instance[i][action])
                            out.push(i);
                    }
                }*/
            }else{
                for(var i in rights){
                    if( rights.hasOwnProperty(i)){
                        if(cached.instance[i][action])
                            out.push(i);
                    }
                }

            }
            return util.ok( out );
        } );

        return util.wait;
    },
    forbid: function( uid, iid, type, role, util ){
        // if there is such role -> delete
        // if there is not such role -> add to antipatterns
        if( !Role ){
            //getRights(uid, util._recall());
        }else{

        }
    },
    list: function (iid, type, user, util) {
        type = type || 'project';
        api.access.can({
            u: user,
            instance: iid,
            type: type,
            action: type+'.access'
        }, function (result) {
            if(result)
                db.getList( 'access', 'iid', iid, function( list ){
                    Z.doAfter.apply(Z, list.map(function (el) {
                        return function (cb) {
                            api.authorize.getUserById({id: el.uid}, function (res) {
                                var o = Z.clone(res);
                                delete o.password;
                                delete o._rev;
                                delete o.agree;
                                delete o.session;
                                delete o.group;
                                el.user = o;
                                cb();
                            })
                        };
                    }).concat(function () {
                        return util.ok(list);
                    }));
                } );
            else
                return util.error(false);
        });
        return util.wait;
    },
    grant: function( uid, iid, type, role, util, user ){
		console.log("Роль")
		console.dir(Role);
        cache.get(uid, function( err, cached ){
            var granter;
            Z.doAfter(function (cb) {
                type = type || 'project';

                if( util.internal || user._id === 'USERNAME'){
                    granter = 'THE MACHINE';
                    cb();
                }else{ // case that user can grant
                    api.access.can({
                        u: user,
                        instance: iid,
                        type: type,
                        action: type+'.access'
                    }, function (result) {
                        if(result) {
                            granter = user._id || user.id;
                            cb();
                        }else
                            return util.error(false);
                    });
                }
            }, function () {
                if( typeMap[type] === void 0 )
                    return util.error( 'incorrectType' );

                if( Role[role] === void 0 )
                    return util.error( 'incorrectRole' );
				console.dir(Role);
                var obj = {
                    uid: uid,
                    iid: iid,
                    type: typeMap[type],
                    rid: Role[role].rid,
                    granter: granter,
                    createDate: +new Date()
                };

                // worst solution
                /*Z.each( rightLoader._actions, function( k ){
                    delete rightLoader._actions[k];
                });*/
                cache.remove(uid);

                db.add( 'access', obj, function(){
                    util.ok();
                } );
            });
        });

        return util.wait;
    },
    clearCache: function( util, user, uid ){
        cache.remove(uid||user._id);
        return true;
    }
};

/*
setTimeout( function(  ){

    Z.each({
        'OBSERVABLE project.view in project MAINPROJ': true,
        'OBSERVABLE project.edit in project MAINPROJ': false
    }, function( k, v ){
        var tokens = k.split(' ');
        api.access.can({uid: tokens[0], instance: tokens[4], type: tokens[3], action: tokens[1] }, function( result ){
            console.log(result, v );
        })
    });
}, 1000);*/
