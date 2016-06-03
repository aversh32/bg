// collaboration - процесс взаимодействия. Когда одна сущность должна обратиться за разрешением к другой сущности
// сейчас в рамках коллаборейшена работает одобрение отправителей смс.
var collaboration;
db.need('collaborate', function( storage ){
    collaboration = storage;
    if(storage.isNew){
        storage.index( ['type', 'creator', 'approver'] );
    }
});

module.exports = {
    getInfo: function( id, user, util ){
        collaboration.get(id, function( instance ){

            if( instance ){
                var tokens = instance.resolver.split('.');
                util.internal = true;
                api[tokens[0]][tokens[1]]({instance: instance, user: user, info: true, util: util});
            }else{
                util.error('noInstance');
            }
        });
        return util.wait;
    },
    create: function( data, creator, approver, resolver, type, util ){
        if( util.internal ){
            var co;
            collaboration.add(co = {
                creator: creator,
                type: type,
                approver: approver,
                data: data,
                resolver: resolver
            }, function( err, res ){
                util.ok( res._id );
            });
            App.q.post('new', {type: 'colaborate', data: co, url: 'api/collaborate/get?creator='+creator});
            return util.wait;
        }
        else
            return false;
    },
    remove: function( user, creator, data, util ){
        if( util.internal ){
            collaboration.getList('creator', creator, function( list ){
                list = list.map(function(el){
                        var o = {};
                        Z.apply(o, el.data);
                        o._id = el._id;
                        o._rev = el._rev;
                        return o
                    }).filter( Z.filter.match(data) );
                list.forEach( function( el ){
                    collaboration.remove(el._id, el._rev);
                });

                util.ok(list);
            });
        }else
            return false;
    },
    get: function( user, creator, util, all ){
        if( !util.internal && user._id !== 'USERNAME' )
            return false;

        collaboration.getList('creator', creator, function( data ){
            util.ok((all?data:data[0])|| false);
        });
        return util.wait;
    },
    list: function( user, util ){
        collaboration.getList('approver', user._id, function( data ){
            util.ok(data);
        });
        return util.wait;
    },
    approve: function( id, user, util ){
        collaboration.get(id, function( instance ){
            if( instance.approver === user._id ){
                var tokens = instance.resolver.split('.');

                api[tokens[0]][tokens[1]]({instance: instance, user: user}, function( data ){
                    console.log(data);
                    if( data === 'no')
                        util.error(123);
                    else
                        util.ok(456);
                    collaboration.remove(instance._id, instance._rev);
                });
            }
        });
        return util.wait;

    },
    deny: function( id, user, util ){
        collaboration.get(id, function( instance ){
            if( instance.approver === user._id ){
                var tokens = instance.resolver.split('.');

                api[tokens[0]][tokens[1]]({instance: instance, user: user, deny: true}, function( data ){
                    console.log(data);
                    if( data === 'no')
                        util.error(123);
                    else
                        util.ok(456);
                    collaboration.remove(instance._id, instance._rev);
                });
            }
        });
        return util.wait;

    }
};
