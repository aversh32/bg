/**
 * Created by Ivan on 12/9/2014.
 */
var curl = require('tinycurl');
var g = curl.getGlobal(),
    db = Z.pg.use('curllog');
g.on('request', function( url, options, g, args ){
    var mm = Z.apply({},options);
    mm.data = (JSON.stringify(options.data,null,2)+'').substr(0,300);
    console.logModule('curl', url, mm);

    //console.log(args);
});
g.on('finish', function( data, code, url, options, resp ){
    //App.megalog.push({curllog: {url:url, data: options.data, resp: data}});

    db.add('curllog',{
        url: url,
        data: options.data,
        code: code,
        result: data,
        createDate: new Date()
    });
});