(function(){
    'use strict';
    var errorHandler = function( data ){

    };
    var qStack = [];
    var qTimeout;
    Z.query = function( obj, callback ) {
        if (typeof callback === 'string') {
            qStack.push({
                error: arguments[4],
                module: arguments[0],
                fn: arguments[1],
                data: arguments[2],
                callback: arguments[3]
            });
            clearTimeout(qTimeout);
            qTimeout = setTimeout(doQuery, 5);
        }else if(typeof obj === 'object'){
            var url = obj.url;
            var fn, module, api;
            url.split('/').forEach(function (el, i) {
                if(el){
                    if(el.toLowerCase() === 'api'){
                        api = el;
                    } else if( api && !module){
                        module = el;
                    } else if (api && module && !fn){
                        fn = el;
                    }
                }
            });
            //console.error('DEPRICATED');
            qStack.push({
                error: obj.error,
                module: module,
                fn: fn,
                data: obj.data,
                callback: callback
            });
            clearTimeout(qTimeout);
            qTimeout = setTimeout(doQuery, 5);
        }


    };
    var doQuery = function () {
        var map = {};

        console.info('QUERY api '+ qStack.map(function (el) {
            return el.module +'.'+ el.fn;
        }));
        $.ajax({
            type: "POST",
            url: 'api/gear/query',//url,
            data: JSON.stringify({fns: qStack.map(function (el, i) {
                map[i] = el;
                return {m:el.module, f: el.fn, d: el.data};
            })}),
            contentType: "application/json; charset=utf-8",
            dataType: "json",
            timeout: 60000,
            success: function(data){
                if( data.error ){
                    console.log('error calling api', data);
                }else{
                    data = data.data;
                    var i, _i, item, obj;
                    for( i = 0, _i = data.length; i < _i; i++ ){
                        item = data[i];
                        obj = map[i];
                        if(item.error) {
                            obj.error && obj.error(item.data);
                            //debugger;
                        }else
                            obj.callback && obj.callback(item);
                    }
                }
            },
            failure: function(errMsg) {
                errorFn('Server error');
            }
        });
        qStack = [];
    };
    Z.secureQuery = function( module, method, auth, data, callback, failCallback ){
        var url = ['api',module,method].join('/')+'?_open='+encodeURIComponent(auth.open),
            sendData = {}, i;
        for( i in data )
            data.hasOwnProperty( i ) && (sendData[i] = data[i]);

        sendData.__time = +new Date();
        var json = JSON.stringify(sendData);
        var hash = CryptoJS.SHA256(auth.close+json);
        url+='&_key='+encodeURIComponent(hash.toString(CryptoJS.enc.Base64));
        typeof callback !== 'function' && (callback = function(){});
        typeof failCallback !== 'function' && (failCallback = function(){});

        $.ajax({
            url: url,
            method: 'POST',
            data: json,
            contentType: "application/json; charset=utf-8",
            dataType: "json",
            success: callback.bind(this),
            error: failCallback.bind(this)
        });
    };

})();