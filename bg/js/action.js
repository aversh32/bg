/**
 * Created by Ivan on 11/21/2014.
 */
var cosher = require('z-redis-cosher');
var action = new cosher({
    name: 'action',
    idKey: 'id',
    connectCfg: App.cfg.redis,
    query: function( id, cb ){
        cb([action.unique,+new Date()]);
    }
});

var fn = module.exports = function( name, interval, c1, c2, second ){
    action.get(name, function( err, val ){
        if( val ){
            var delta = (+new Date()) - parseInt( val[1], 10 );
            if( (second === true && val[1] === action.unique) ||
                ((delta > interval && val[1] !== action.unique) || (delta > interval * 1.5))
            ){
                if( second ){
                    action.hash[name] = [action.unique, +new Date()];
                    action.change( name );
                    console.logModule('action', '+' + name + ' by: '+ action.unique  );
                    c1();
                }else{
                    setTimeout( fn.bind( this, name, interval, c1, c2, true ), 10 );
                }
            }else{
                //console.green( '-' + name + ' ' + val );
                c2 && c2();
            }
        }else{
            setTimeout( fn.bind( this, name, interval, c1, c2 ), 25 );
        }
    });
};
fn.unique = action.unique;