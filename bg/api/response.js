/**
 * Created by Ivan on 10/10/2014.
 */
var Path = require('path');
    var base = App.base;
    var fs = require( 'fs' ),
        tpl = require(base+'/js/tpl' ),
        urlLib = require('url' ),
        http = require('http');
module.exports = {
    send: function( pid, type, data, util ){
        if(!util.internal)
            return false;
        api.project.get({id: pid}, function( project ){
            var request = project.request && project.request[type],
                url, body;


            if(!request){
                if( type.indexOf('.') ){
                    var tokens = type.split('.' ),
                        notify = api[tokens[0]] && api[tokens[0]].notify;
                    if(notify){
                        notify({type: tokens.slice(1), data: data, pid: pid});
                    }
                }
                return util.ok();
            }
            data.additional = typeof data.additional === 'object' && data.additional !== null? data.additional : {};
            var tpldURL;
            try{
                tpldURL = tpl.getJSF( request.url + '' ).f( data );
            }catch(e){
                return util.ok('invalid url template');
            }
            if(tpldURL.toLowerCase().indexOf('api/test/response')>-1)
                return util.ok('niceTry');
            try{
                url = urlLib.parse( tpldURL );
            }catch(e){
                return util.ok('invalid url');
            }



            try{
                body = tpl.getJSF(request.body+'').f(data);
            }catch(e){
                return util.ok('template error');
            }
            var method = request.method || 'POST';
            var post_data = body;
            var post_options = {
                host: url.hostname,
                port: url.port,
                path: url.path,
                method: method,
                headers: {
                    'Content-Type': 'application/x-www-form-urlencoded',
                    'Content-Length': post_data.length
                }
            };
            var statusCode;
            // Set up the request
            try{
                var response_data = '';
                var callback = function(  ){
                    callback = void 0;
                    util.ok( {
                        port: url.port,
                        host: url.hostname,
                        path: url.path,
                        body: post_data,
                        method: method,
                        status: statusCode,
                        data: response_data
                    } );
                };

                var post_req = http.request( post_options, function( res ){
                    var data = '';
                    statusCode = res.statusCode;

                    //another chunk of data has been recieved, so append it to `str`
                    res.on('data', function (chunk) {
                        response_data += chunk;
                    });

                    //the whole response has been recieved, so we just print it out here
                    res.on('end', function () {
                        callback && callback();
                    });

                } );
                post_req.on('socket', function( socket ){
                    socket.setTimeout(20000);
                    socket.on('timeout', function() {
                        callback && callback();
                        post_req.abort();
                    });
                });
                post_req.write( post_data );
                post_req.end();
            }catch(e){
                return util.ok('invalid request (check url)');
            }

        });
        return util.wait;
    }
};