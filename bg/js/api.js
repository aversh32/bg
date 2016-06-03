var fullDoc = {};
exports = module.exports = (function(  ){
    'use strict';
    var log = Z.pg.use('log');
    var wait = App.wait;

    var CallbackUtils = function( callback, errorCallback ){
        this.callback = callback;
        this.errorCallback = errorCallback;
        this.wait = new wait();
    };
    var rightRegexp = /#can\s+?(\w*?)\s+(do\s+?)?([\w\.]*?)\s+?in\s+?((\w*?):\s+?)?([\w\.]*)?[\n\r\t\s]*?/;
    CallbackUtils.prototype = {
        error: function( data ){
            if( this.errorCallback )
                this.errorCallback(data);
            else
                this.callback && this.callback(false);
        },
        ok: function( data ){
            this.callback && this.callback(data);
        },
        answer: function( data, error ){
            this[error ? 'error' : 'ok']( data );
        },
        _recall: function(  ){
            return (function( fn, self, args ){
                return function(  ){
                    fn.apply(self, args);
                };
            })(this._fn, this._self, this._args);
        },
        internal: true
    };
    var getVar = function( obj, name ){
        return name.split('.').reduce(function(a,b){
            return a && a[b];
        }, obj);
    };
    var apiCallStats = {};
    var _wrapFn = function( fn, args, security, fnName ){
        var needUtil = args.indexOf('util') > -1;
        return function( obj, callback, errorCallback ){
            !apiCallStats[fnName] && (apiCallStats[fnName] = 0);
            apiCallStats[fnName]++;

            var fnArguments = [], i, _i, name;
            if( needUtil && !obj.util ){
                obj.util = new CallbackUtils(callback, errorCallback);
            }

            for( i = 0, _i = args.length; i < _i; i++ ){
                name = args[ i ];
                fnArguments.push( name in obj ? obj[name] : void 0 );
            }
            //console.log(obj);
            //console.log(args);
            //console.log( fnArguments );

            if( needUtil ){
                obj.util._fn = fn;
                obj.util._self = this;
                obj.util._args = fnArguments;
            }
            if( security ){
                api.access.can({
                    u: obj.util && obj.util.internal ? App.setSecurityFlag({_id: 'USERNAME'}) :obj[security[1]],
                    instance: getVar(obj, security[6]),
                    action: security[3],
                    type: security[5]
                }, function( can ){
                    if( can === true ){
                       fn.apply( this, fnArguments );
                    }else{
                        obj.util.error('can not '+ security[3]);
                    }
                });
                if( needUtil ) return obj.util.wait;
            }else{
                var out = fn.apply( this, fnArguments );
                if( !(out instanceof wait) )
                    out === false ? obj.util.error(out) : obj.util.ok(out);
                return obj.util.wait;
            }


        };
    },
        normalize = function( data ){
            var d = Z.clone(data);
            delete d.user;
            return d;
        },
        wrapFn = function( fn, fnName ){
            var text = fn.toString(),
                args = text.match(/function[^\(]*\(([^)]*)\)/)[1].split(',').map( function( paramName ){ return paramName.trim(); } ).filter(JS.filter.notEmptyString),
                description = Z.getComments( text ),
                security = description
                    .map( Z.getProperty('text') )
                    .join( '\n' )
                    .match( rightRegexp ),
            //comments = JS.getComments( text ),
                wrap = {
                    description: description,
                    original: fn,
                    fn: _wrapFn(fn, args, security, fnName),
                    args: args,
                    needUser: args.indexOf('user') > -1
                };
                security = wrap.description.map( Z.getProperty('text') ).join('\n').match(rightRegexp);
            if( security !== null ){
                wrap
            }
            return wrap;
        },
        fs = require('fs' ),
            api = GLOBAL.api = {
            init: function( dirName, callback ){
                this.controllers = dirName;
                this.cache = {};
                this.initModules(callback);
            },
            reinit: function (name) {
                this._initModule( this.cache[name], name );
            },
            initModules: function(callback){
                this.modules = {};
                fs.readdir( this.controllers, function(err, data){
                    Z.each(data, function( el ){
                        if( el.substr( el.length - 3, 3 ) === '.js' ){
                            var path = [ this.controllers, el ].join( ''),
                                name = el.substr( 0, el.length - 3 );
                            this.cache[name] = path;
                            this.reinit(name);
                        }
                    }.bind(this));
                }.bind(this));

                callback && callback();
            },
            resolve: function( req, res ){

                var response = new App.response(res);
                response.addHeader && response.addHeader({
                    'Access-Control-Allow-Origin': '*',
                    'Access-Control-Allow-Methods': 'GET,PUT,POST,DELETE'
                });
                var url = req.originalUrl.replace(/^\/api\//,'').split('?')[0].split('/').filter( function( el ){return el.trim() !== ''; } );

                if( url.length ){
                    var module = this[url[0]];
                    if( module ){
                        var fn = module[url[1]];
                        var lowered = (url[1]+'').toLowerCase();
                        if( lowered !== 'docs' && lowered !== 'report' && lowered !== 'fulldoc')
                            response.addHeader && response.addHeader({
                                'Content-Type':'application/json'
                            });
                        if( fn ){

                            App.request( req, function( data ){

                                log.add('apilog',{
                                    u: data.user ? data.user._id : 'None',
                                    module: response._module = url[0],
                                    fn: url[1],
                                    data: JSON.stringify(normalize(data)),
                                    createDate: +new Date()
                                }, function( err, id ){

                                    response.setEid && response.setEid(id.eid);
                                });
                                if(data._format){
                                    response.useFormat(data._format);
                                    delete data._format;
                                }

                                if( !fn.detail.needUser || data.user ){
                                    data.util = response;
                                    data.util.user = data.user;
                                    var result = fn.call(module, data);
                                    if( result !== false ){
                                        if( !(result instanceof App.wait) ){
                                            response.ok( result );
                                        }
                                    }else
                                        response.error('Error');
                                }else
                                    response.error('Security');
                            });
                        }else{
                            response.error('No such function in a module');
                        }
                    }else{
                        response.error('No such module');
                    }
                }else{
                    response.error('Please specify module');
                }
            },
            getApi: function( wrapped ){
                var systemArguments = Z.a2o(['util', 'user']);
                var out = {}, i, obj, args, j, _j, fnArgs, argName;
                for( i in wrapped ) if( wrapped.hasOwnProperty( i ) ){
                    obj = wrapped[ i ];

                    args = out[ obj.detail.name ] = {};
                    fnArgs = (obj.detail.args || []).slice().sort();
                    for( j = 0, _j = fnArgs.length; j < _j; j++ ){
                        argName = fnArgs[ j ];
                        if( !(argName in systemArguments) ){
                            args[ argName ] = '';
                        }
                    }
                }
                return out;
            },
            docs: function( wrapped, moduleName ){
                var systemArguments = Z.a2o(['util', 'user']);
                var out = [], i, obj, args, j, _j, fnArgs, argName, already = {};
                for( i in wrapped ) if( wrapped.hasOwnProperty( i ) ){
                    obj = wrapped[ i ];
                    var name = obj.detail.name;
                    if( name.charAt(0) !== '_' ){
                        if( obj.detail.description.length && ! already[obj.detail.name] ){
                            out.push({
                                name: obj.detail.name,
                                title: '<div class="functionName"><a name="'+ obj.detail.name +'">'+ obj.detail.name +'</a>' +
                                    '<span class="gray">api/'+ moduleName +'/'+ obj.detail.name +'</span></div>',
                                text: Z.renderHelp( Z.paddingsToArray([obj.detail.description[0]].map( Z.getProperty('text')).join('\n')) ).join('\n'),
                                //textRaw: obj.detail.description[0],
                                detail: obj.detail,
                                mdl: moduleName
                            });

                            if( out[out.length - 1].text.indexOf('<div')===-1 )
                                out.pop();
                        }
                    }
                    already[obj.detail.name] = true;
                }
                out.sort( function( a, b ){
                    return a.name > b.name ? 1 : a.name < b.name ? -1 : 0;
                });
                fullDoc[moduleName] = out;
                return tpls.help({
                    list: out,
                    up: true,
                    itemName: moduleName,
                    data: out.map(function(el){ return el.title +'\n'+ el.text; } ).join('<hr>')
                });
            },
            _wrapModule: function( obj, name ){
                var wrapped = {}, wrapper, getApi = this.getApi, docs = this.docs;
                wrapped.getapi = wrapped.getApi = wrapFn( function(){
                    return getApi( wrapped );
                } );
                wrapped.getapi.name = 'getApi';
                wrapped.getapi.fn.detail = wrapped.getapi;
                wrapped.getApi = wrapped.getapi = wrapped.getapi.fn;

                wrapped.docs = wrapFn( function(util){
                    util.stringify = function( data ){
                        return data.data;
                    };
                    return docs( wrapped, name );
                } );
                wrapped.docs.name = 'docs';
                wrapped.docs.fn.detail = wrapped.docs;
                wrapped.docs = wrapped.docs.fn;

                var data = {};

                wrapped.getJSON = wrapped.getjson = wrapFn( function(  ){
                    return data;
                }) ;
                wrapped.getJSON.name = 'getJSON';
                wrapped.getJSON.fn.detail = wrapped.getJSON;
                wrapped.getJSON = wrapped.getjson = wrapped.getJSON.fn;
                obj.apiCallStats = function () {
                    return apiCallStats;
                };
                obj.fullDoc = function (util) {
                    util.stringify = function( data ){
                        return data.data;
                    };
                    var out = '';
                    for(var i in fullDoc) if(fullDoc.hasOwnProperty(i)){

                        var doc = fullDoc[i];
                        if(!doc[0])
                            continue;

                        out += '<div class="module_doc"><h1 class="module_title">'+i+'</h1>\n'+
                            '<div class="module_path">'+doc[0].mdl+'</div>\n';

                        out+='<div class="module_description">'+doc.map(function(fn){
                                return '<div class="fn_name">'+fn.name+' <span class="fn_path">api/'+i+'/'+fn.name+'</span></div>\n'+
                                        '<div class="fn_description">'+fn.text+'</div>'
                            })+'</div>\n'+
                            '</div>\n';
                    }
                    return out;
                };

                Z.each( obj, function( k, v ){
                    if( typeof v === 'function' /*&& k.charAt(0) !== '_'*/ ){
                        wrapper = wrapFn( v, name +'.'+ k );
                        wrapper.name = k;
                        wrapper.fn.detail = wrapper;

                        wrapped[ k ] = wrapped[ k.toLowerCase() ] = wrapper.fn;
                        data[k] = wrapper;
                    }
                });



                //fs.writeFileSync('./json/'+name+'.json', JSON.stringify(data,true,2));

                Z.MQ.subscribe( 'api.'+ name, this.MQWrap.bind(this, name), true );
                docs( wrapped, name );
                return wrapped;
            },
            MQWrap: function( name, data ){
                var args = data.data;

                var util = args.util = new Z.MQ.Util(data);
                var result = api[name][data.fn](data.data);
                if( result !== false ){
                    if( !(result instanceof Z.MQ.Util.wait) ){
                        util.ok( result );
                    }
                }else
                    util.error('Error');
            },
            _initModule: function( path, name, callback ){
                try{
                    delete require.cache[App.base+'/'+path];
                    var module = require( App.base+'/'+path ),
                        url = this.url,
                        apiWrapper;
                }catch(e){
                    Z.error( 'Loading `'+ path +'` failed');
                }
                try{
                    apiWrapper = this._wrapModule( module, name );
                    name = module.apiName || name;
                }catch(e){
                    console.log(e);
                    Z.error( 'Wrap module `'+ path +'` failed');
                }
                loadedModulesLog.push( name );
                clearTimeout(timeout); timeout = setTimeout(showLoaded, 5);

                this[ name ] = this[ name.toLowerCase() ] = apiWrapper;//new module( this );
                callback && callback( this[name] );
            }
        };
    var timeout;
    var showLoaded = function(  ){
        if(!loadedModulesLog.length)return;
        console.green( 'Modules '+ loadedModulesLog.join(', ') +' loaded' );
        loadedModulesLog = [];
    };
    var loadedModulesLog = [];
    return api;
})();
