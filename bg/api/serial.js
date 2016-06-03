var serials;
db.need('serial', function( storage ){
    serials = storage;
    if(storage.isNew){
        console.log('create serial hash');
        storage.index(['open','close',['instance','owner']]);
    }
    /*if( GLOBAL.createBG )
        storage.add({
            instance:
            _id: 'MAINPROJ',
            creator: 'USERNAME',
            smsPrice: 60,
            createDate: +new Date(),
            name: 'MAINPROJ'
        });*/
});
var cosher = require('z-redis-cosher');
var hash = new cosher({
    name: 'serial',
    idKey: 'open',
    timeout: 1200,
    connectCfg: App.cfg.redis,
    query: function( id, cb ){
        serials.get('open', id, function(data){
            cb({
                owner: data.owner,
                close: data.close,
                instance: data.instance,
                open: data.open
            });
        });
    }
});

exports = module.exports = {
    get: function( user, instance, util ){
        /*
        Get project access serial
        #can user getApiKeys in instance
         */
        api.project.get({id: instance}, function( project ){
            if( !project )
                return util.error('noSuchProject');
            if( project.creator !== user._id && user._id !== 'USERNAME')
                return util.error('noRights');
            serials.get('instance-owner',[instance,project.creator], function( data  ){
                if( data ){
                    api.serial.getByOpen({open: data.open}, function( data ){
                        if( data ){
                            util.ok(data)
                        }else{
                            util.error('error');
                        }
                    });
                }else{
                    api.serial.create({owner: project.creator, instance: instance}, function( data ){
                        if( data ){
                            util.ok(data);
                        }else
                            util.error();
                    });
                }
            });
        });

        return util.wait;
    },
    create: function( owner, instance, util ){
        if( !util.internal )
            return false;

        var open = Z.UUID.someRandom(),
            close = Z.UUID.someRandom()+Z.UUID.someRandom(),
            data = {owner: owner, instance: instance, open: open, close: close};
        serials.add(data, function( ){
            hash.get(data.open);
            util.ok(data);
        });
        return util.wait;
    },
    getByOpen: function( open, util ){
        if( !util.internal )
            return false;
        hash.get(open, function(err, key){
            if( key ){
                util.ok( key );
            }else{
                util.error('No such key');
            }
        });

        return util.wait;

    }
};