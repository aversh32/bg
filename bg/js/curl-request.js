(function(){

    var util = require( 'util' ),
        fs = require( 'fs' ),
        cwd = process.cwd(),
        slice = Array.prototype.slice,
        observable = require('events').EventEmitter,
        child = require('child_process' ),
        emptyFn = function(){},
        convert = {
            headers: function( val, args ){
                if( typeof val === 'string' )
                    args.push({order: 0, data: ['-H', val]});
                else
                    val.forEach( function( val ){
                        args.push({order: 0, data: ['-H', val]});
                    });
            },
            request: function( val, args ){
                args.push({order:5, data: ['-X', val]});
            },
            url: function( val, args ){
                args.push({order:10, data: ['-k', val]});
            },
            low: emptyFn
        },
        obj = {
            getConvert: function(  ){
                // for extension purpose
                return convert;
            },
            request: function( url, options, callback, bonus ){
                var o = new observable(),
                    opt = {},
                    args = [],
                    i,
                    val, key;

                if( typeof url === 'string' ){
                    options.url = url;
                }else{
                    callback = options;
                    options = url;
                }
                if( typeof callback !== 'function' ){
                    throw 'no callback specified';
                }
                for( i in bonus )
                    if( bonus.hasOwnProperty( i ) )
                        options[i] = bonus[i];

                for( i in options ) if( options.hasOwnProperty( i ) ){
                    val = options[i];
                    if( convert[i] ){
                        convert[i](val, args);
                    }else{
                        if( i.indexOf('-') === 0 ){
                            args.push({
                                order: 1,
                                data: val === true ? [i] : [i, options[i]]
                            });
                        }else{
                            key = i;
                            // if key is 1 or 2 symbols length - it's a shortcut. maybe it's a bad logic, but it worked for me
                            key = (key.length < 3 ? '-' : '--' ) + key;
                            args.push({
                                order: 1,
                                data: val === true ? [key] : [key, options[i]]
                            });
                        }
                    }
                }
                // sort respective to order param
                args.sort( function( a, b ){
                    return a.order - b.order;
                });

                // take only data and join it all to single array
                args = Array.prototype.concat.apply([], args.map( function( el ){
                    return el.data;
                }));

                var curl = child.spawn('curl', args, { cwd: process.cwd() });

                var out = '', err = '';
                curl.stdout.on('data', function (data) {
                    o.emit('stdout', data);
                    //console.log(data.toString())
                    out += data;
                });
                curl.stderr.on('data', function (data) {
                    o.emit('stderr', data);
                    //console.log(data.toString())
                    err += data;
                });
                curl.on('exit', function (code) {
                    o.emit('exit', code);
                    callback(err, out);
                });

                // if curl option is set - you can do what you want with it in low level
                return options.low ? curl : o;
            },
            post: function( ){
                return bonus(arguments, {request: 'POST'});
            },
            get: function( ){
                return bonus(arguments, {request: 'GET'});
            }
        },
        bonus = function( args, bonus ){
            args = slice.call(args);
            args[3] = bonus;
            obj.request.apply( this, args );
        };
    exports = module.exports = obj;

})();