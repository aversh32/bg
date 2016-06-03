(function(  ){
    var log = Z.pg.use('log');
    var App = GLOBAL.App = GLOBAL.App || {},
        url = require( 'url' );
    var wait = App.wait = function wait(){};

    var response = function( res ){
        this.response = res;
        this.wait = new wait();
    };
    function simple(el){
        if( el === null )
            return 'null';
        else if(el===true)
            return 'true';
        else if(el===false)
            return 'false';
        else if(el===void 0)
            return 'Null';
        else
            return el.toString();
    }
    function doPlain(obj, prefix){
        if(prefix===void 0){
            obj = JSON.parse(JSON.stringify(obj));//remove cycling
            prefix = '';
        }

        if( Z.isArray(obj) ){
            var out = [];
            for( var i = 0, _i = obj.length; i < _i; i++ ){
                var subPrefix = (prefix?prefix+' ':'')+'array_'+i;
                var val = obj[i];
                if( typeof obj[i] === 'object' )
                    out = out.concat(doPlain(obj[i], subPrefix))
                else
                    out.push('['+subPrefix+']'+'\n'+i+' = '+ simple(obj[i]));
            }
            return out.join('\n');
        }else if( typeof obj === 'object' ){
            var out = ['['+prefix+']'];
            for( var i in obj ){
                if( obj.hasOwnProperty(i) ){
                    var subPrefix = (prefix?prefix+' ':'')+'obj_'+i;
                    if( typeof obj[i] === 'object' )
                        out = out.concat(doPlain(obj[i], subPrefix))
                    else
                        out.push(i+' = '+simple(obj[i]));
                }
            }
            return out.join('\n');
        }else{
            return obj;
        }

    }
    var yaml = require('js-yaml'),
        xml = require('jstoxml');
    var responseFormats = {
        jsonp: function (data) {
            return '<html><head><meta encoding="utf-8" charset="utf-8"/><script language="JavaScript">jsonpCb('+JSON.stringify(data)+');</script></head></html>'
        },
        yaml: function(data){
            return yaml.dump(data)
        },
        plain: function( data ){
            return doPlain(data);
        },
        xml: function (data) {
            return xml.toXML({response: data});
        }
    };

    response.prototype = {
        setEid: function( eid ){
            this.eid = eid;
            this.tryLog();
        },
        tryLog: function(  ){
            if(this._module !== 'web' && this._module !== 'log')
            this.eid !== void 0 && this._result !== void 0 && log.add('apianswer', {
                eid: this.eid,
                data: this._result
            })
        },
        addHeader: function (cfg) {
            this._headers = this._headers || {};
            Z.apply(this._headers, cfg);
        },
        setStatus: function (num) {
            this._status = num;
        },
        useFormat: function( format ){
            responseFormats[format] && (this.stringify = responseFormats[format]);
        },
        error: function( text ){
            this.answer( text, true );
        },
        iframeOk: function( out ){
            this.response.send('<html><head><script language="JavaScript">parent.Z.iframeAnswer('+JSON.stringify(out)+');</script></head></html>');
            return out;
        },
        ok: function( data ){
            this.answer( data, false );
        },
        stringify: function( data ){
            return JSON.stringify(data)
        },
        answer: function( data, error ){
            var out = this.stringify({error: error || false, data: data, time: +new Date()});
            this._result = out;
            this.tryLog();
            if( this.response ){

                if( this._headers && this.response.header ){
                    //debugger;
                    var headers = this._headers;
                    for(var i in headers) headers.hasOwnProperty(i) && this.response.header(i, headers[i]);
                }
                this.response.statusCode = this._status || 200;
                /*this.response.writeHead && this.response.writeHead(, this._headers || {});
                this.response.statusCode = this._status || 200;
                debugger;*/
                this.response.send( out );
            }
            return data;
        },
        _recall: function(  ){
            return (function( fn, self, args ){
                return function(  ){
                    fn.apply(self, args);
                };
            })(this._fn, this._self, this._args);
        }
    };

    App.response = function(res){
        return new response(res);
    };
    var request = function( req, callback, keyResolver ){
        this.request = req;
        this.callback = callback;
        this.keyResolver = keyResolver;
        this.parse();
    };
    var crypto = require('crypto' ),
        fs = require('fs');
    request.prototype = {
        parse: function(){
            var request = this.request,
                parts = url.parse( request.url, true ),
                data = Z.apply({}, parts.query ),
                bodyData,
                callback = this.callback,

                apiKeyValid = false,
                keyResolver = this.keyResolver;/*,
                files = request.files, i;
            if( files ){

                for( i in files ){
                    console.log(files);
                    files.hasOwnProperty(i) && (data[i] = files[i]);
                }
            }*/
            var auth = false;
            Z.doAfter(
                function( callback ){
                    if( data._open ){
                        callback();
                    }else if( request.cookies.u ){
                        /*fs.appendFile('public/message.log', request.cookies.u+'\n', function (err) {
                            console.log(err);
                        });*/
                        api.authorize.getUserByHash({hash:request.cookies.u}, function( user ){
                            //console.log(user);
                            data.user = user;
                            callback();
                        });
                    }else{
                        callback();
                    }
                },
                function( callback ){
                    if( request.method === 'POST' ){
                        var body = '';
                        request.on( 'data', function( data ){
                            body += data;
                            if( body.length > 1024*1024 ){ //1 mb
                                // ddos
                                request.connection.destroy();
                            }
                        } );
                        request.on( 'end', function(){

                            try{
                                data._body = body;
                                bodyData = JSON.parse( body );
                                Z.apply( data, bodyData );
                            }catch(e){
                                //console.log(body,decodeURIComponent(body));
                                try{
                                    bodyData = {};
                                    body.split('&').forEach(function (el) {
                                        var tokens = el.split('=');
                                        bodyData[decodeURIComponent(tokens[0])] = JSON.parse(decodeURIComponent(tokens[1]));
                                    });
                                    data._body = false;
                                    Z.apply( data, bodyData );
                                }catch(e){

                                }
                            }
                                if( data._open && data._key ){
                                    api.serial.getByOpen({open: data._open}, function( auth ){
                                        if( auth ){
                                            var shasum = crypto.createHash('sha256');
                                            shasum.update( auth.close+ body, 'utf8' );
                                            shasum = shasum.digest('base64');
                                            if( shasum === data._key ){
                                                apiKeyValid = true;
                                                api.authorize.getUserById({id: auth.owner}, function( user ){
                                                    if( user ){
                                                        data.user = user;
                                                        callback();
                                                    }else{
                                                        apiKeyValid = false;
                                                        callback();
                                                    }
                                                });
                                            }else{
                                                //debugger;
                                                callback();
                                            }
                                            console.log([shasum,apiKeyValid]);
                                            return;

                                        }else{
                                            callback();
                                            return false;
                                        }
                                    });
                                }else{
                                    callback();
                                    return false;
                                }

                            // use POST
                            //callback();
                        } );
                    }else{
                        callback();
                    }
                },
                function(  ){
                    //console.log(data);
                    if (data['$JSON$']) {
                        Z.apply(data, data['$JSON$']);
                    }

                    callback( data, apiKeyValid );
                }
            );

        }
    };
    App.request = function( req, callback, keyResolver ){
        return new request(req, callback, keyResolver);
    }
})();