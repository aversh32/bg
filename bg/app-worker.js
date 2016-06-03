#!/bin/sh
':' //; exec "$(command -v nodejs || command -v node)" "$0" "$@"

var express = require('express');
var app = express();
app.disable('x-powered-by');

var server = app.listen(3000, function() {
    console.log('Listening on port %d', server.address().port);
});

//GLOBAL.createBG = true;
/*var x = 0, ld = +new Date();
setInterval( function(  ){
    x++;
    var d = +new Date();
    if( d-ld >15){
        console.log(d-ld);
    }
    ld = d;
}, 10);*/


/*var redis = require("redis"),
    client = redis.createClient();

client.on("error", function (err) {
    console.log("error event - " + client.host + ":" + client.port + " - " + err);
});

client.set("string key", "string val", redis.print);
client.hset("hash key", "hashtest 1", "some value", redis.print);
client.hset(["hash key", "hashtest 2", "some other value"], redis.print);
client.hkeys("hash key", function (err, replies) {
    if (err) {
        return console.error("error response - " + err);
    }

    console.log(replies.length + " replies:");
    replies.forEach(function (reply, i) {
        console.log("    " + i + ": " + reply);
    });
});

client.quit(function (err, res) {
    console.log("Exiting from quit command.");
});*/



//require('look').start();

//var clc = require('cli-color');
var orig = console.log;
var p = function (t) {
    t = t+'';
    t.length === 1 && (t=' '+t);
    return t;
},
    p4 = function (t) {
        t = t+'';
        switch (t.length){
            case 0:
                return '    ';
            case 1:
                return '   '+t;
            case 2:
                return '  '+t;
            case 3:
                return ' '+t;
            case 4:
                return t;
        };

    },
    slice = Array.prototype.slice,
    renderer = function(el){
        var type = typeof el;
        switch(type){
            case 'boolean':
                return el ? 'True' : 'False';
            case 'object':
                try {
                    return JSON.stringify(el, null, 2)
                }catch(e){
                    return 'OBJECT';
                }


        }
        return el;
    };

console.log3 = function () {
    var size,
        args = slice.call(arguments);
    if (process.stdout.isTTY) {
      size = process.stdout.getWindowSize();
    } else {
      size = [120,40];
    }

    var w = size[0],
        d = new Date(),
        date = (''+d.getFullYear()).substr(3) + (d.getMonth()+1)+p(d.getDate())+ (d.getHours())+':'+ (d.getMinutes())+':'+ p(d.getSeconds())+p4(d.getMilliseconds()),
        l = date.length,
        lines = [],
        data = args.map(renderer).join(', '),
        pos,
        pad = new Array(l+1).join(' '),
        first = true,
        pos0;
    w-=l+1;
    while(data.length){
        pos = pos0 =  data.indexOf('\n');
        pos = Math.min(w, pos === -1 ?  data.length : pos);
        lines.push( data.substr(0,pos));
        data = data.substr(pos+(pos===pos0?1:0));
        first = false;
    }
    var i=0, _i = lines.length, _ii = _i - 1, out = [], line, c = ((_ii)/2)|0,sgn;
    for( ;i < _i; i++){
        sgn = (i===_ii&&i>0?'}':i===0&&_ii>0?'{':'|');
        if(i===c){
            out[i] = date+sgn+lines[i];
        }else if(i===_ii||i===0){
            out[i] = new Array(l+1).join('-') + sgn +lines[i];
        }else{
            out[i] = pad + sgn+lines[i];
        }

    }
    /*if( lines.length > 1 ){
        lines[lines.length - 1] = new Array(l+1).join('-') +'+'+ lines[lines.length - 1].substr(l+1);
    }*/
    orig.call(console, out.join('\n'));
    //orig.apply(console,[date].concat(Array.prototype.slice.call(arguments)));


};

var good = function(text){return text};//clc.greenBright;
var bad = function(text){return text};
console.green = function(data){console.log(good(data));};
console.red = function(data){console.log(bad(data));};
var logging = {status:1, infobip: 1,pg:1,
    'PG:DEBUG:EDIT': 1,
    'PG:DEBUG:EDIT_RESULT': 1
},//infobip:1
    notLogging = {},
    lastLogged;
console.logModule = function (module) {
    if(logging[module]){//||!notLogging[module]) {
        if(lastLogged !== module) {
            lastLogged = module;
            console.log('---' + module.toUpperCase() + '---');
        }
        console.log.apply(console, Array.prototype.slice.call(arguments, 1));
    }
};

GLOBAL.debug = true;      //изменил, было false 
GLOBAL.minified = true;
GLOBAL.envVars = 'app';
process.argv.slice(2).forEach( function( param ){
    param = param.replace(/^-*/, '' ).trim();
    if( param === 'debug' ){
        GLOBAL.debug = true;
        GLOBAL.minified = !GLOBAL.minified;
    }
    if( param === 'min' )
        GLOBAL.minified = !GLOBAL.minified;

    if( param.indexOf('env=') === 0 )
        GLOBAL.envVars = param.substr(4).trim();
});
var debug = GLOBAL.debug,
    minified = GLOBAL.minified;
console.log(good('DEBUG MODE '+ (debug ? 'ON': 'OFF')));
console.log(good(minified?'USING COMPRESSED CLIENT JS':'USING DEBUG UNCOMPRESSED CLIENT JS'));
!debug && process.on('uncaughtException', function(err) {
    // handle the error safely
    console.log('ALARM!', err);
    console.log(err.stack)
});

require('./js/Z');
require('./js/helpHighlight');
require('./js/UUID');
require('./js/clientHash');

Z.logging = logging;
Z.notLogging = notLogging;
var tpl = require('./js/tpl' ),
    t = GLOBAL.tpls = tpl.renderers,
    w = GLOBAL.w = require('./js/widgets')({tpl: tpl});

var Path = require('path');
var base = Path.dirname(process.mainModule.filename);
GLOBAL.App = {base: base, megalog: [], log: function(  ){

}};
GLOBAL.App.megalog.push = function(a){
    var out = Array.prototype.push.call(this,a);
    this.length>3000 && (this.splice(0,1));
    return out;
};
App.log = function(  ){

};

App.cfg = require('./cfg');
var applyCfg = function(path){
    var o = process.env, name, l = path.length, tokens, tl,
        cfg = App.cfg;
    for(name in o){
        if(name.toLowerCase().indexOf(path)===0){
            tokens = name.substr(l).toLowerCase().split('_');
            tl = tokens.length-1;
            tokens.reduce(function(a, b, c){
                if(b==='')return a;
                if(c<tl){
                    return b in a ?a[b]:a[b] = {}
                }else{
                    a[b] = o[name]
                }
                return a;
            }, cfg)
        }
    }
};
GLOBAL.envVars && applyCfg(GLOBAL.envVars);


App.action = require('./js/action');
require('./js/MQ');
require('./js/database');
require('./js/postgres');
require('./js/App');
require('./js/api');
require('./js/curllog');
//require('./js/stdin');

api.init('api/');

var vm = GLOBAL.vm = Z.include('./viewmodel/');
console.log(vm);
//setInterval( function(  ){
tpl.loadAll('views');
//},3000);





/* IRONY */
var iron_mq = require('iron_mq');
var imq = new iron_mq.Client({"token": "cLry5s7DPmnntX4FeW81dCg7Gl8", "project_id": "54c6a914c036ea00060000cf"});
App.q = {
    getQ: function( name ){
        var Q = App.q[name];
        !Q && (Q = App.q[name] = imq.queue(name));
        return Q;
    },
    post: function( name, data ){
        console.log('Q post', name, data);
        App.q.getQ( name ).post({body: JSON.stringify(data), timeout: 60*60}, function(err, data){
            console.log(err,data)
        });
    }
};
var queue = imq.queue("qqq");

/* END IRONY */
var eml = App.eml = require('emailjs').server.connect(App.cfg.email);
App.email = {send: function( data, cb ){
    /*
{
 "job": "mailer@handleQueuedMessage",
 "data": {
 "view": "emails.project.low_balance",
 "data": [],
 "callback": "C:38:\"Illuminate\\Support\\SerializableClosure\":139:{a:2:{i:0;s:110:\"function ($message) {\n $message->to('rs@billingrad.com', 'Джон Смит')->subject('Привет!');\n};\";i:1;a:0:{}}}"
 },
 "attempts": 1,
 "queue": "notify"
}
     */
    try {
        App.q.post('notify.email', data, function (err, data) {
            console.log(err, data);
        });
    }catch(e){

    }
    if(debug)
        console.log(data);
    else
        eml.send(data, cb);
}};

App.log = function( name, data ){

};
var f = function(){return this};
App.io = {'in': f, 'to': f, 'emit': f, join: f};
App.io[0] = App.io;
/* COMMENTED SOCKETS
setTimeout( function(  ){

var redis = require('socket.io-redis');
var io = require('socket.io')(server);
io.adapter( redis( App.cfg.redis ) );
App.io = io;

var c11 = 0;
App.log = function( data ){
    App.io.to('log').emit('msg', data);
};


io.on('connection', function (socket) {
  var c = {};
    (socket.conn.request.headers.cookie||'').split(';').map(function(el){
        if( el !== ''){
        var tokens = el.split('=');
            if( tokens[1] )
                c[ tokens[0].trim() ]=decodeURIComponent( tokens[1].trim());
        }
    });
  if(c.u){
      api.authorize.getUserByHash({hash:c.u}, function( user ){
        if(user){
            console.log('joined', user._id);
            socket.join(user._id);
            socket.emit('joined', {type: 'user', id: user._id});
            api.project.list({user: user}, function( list ){
                list.forEach( function( el ){
                    console.log('joined', el.id);
                    socket.join(el.id);
                    var subscribe = Z.MQ.subscribe('io:'+el.id, function( data ){
                        App.log(data);
                        App.io.to( el.id ).emit(data.type, data.data);
                    });
                    socket.on('disconnect', function () {
                        subscribe.remove();
                    });
                    socket.emit('joined', {type: 'project', id: el.id});
                });
            });
        }
      });
  }
  socket.on('giveLog', function(){
      socket.join('log');
  });
    *//*
  socket.emit('hello', 'You are welcome');
  socket.on('join', function(data){
    socket.join(data);
  });
  socket.on('leave', function(data){
    socket.leave(data);
  });*//*
  *//*socket.on('my other event', function (data) {
      setTimeout( function(  ){

io.sockets.emit('news', {hello: c11++});
          io.to('some room').emit('news2',{da:'da'});
    //socket.emit('news', { hello: c11++ });
          },1000);
    console.log(data);
  });*//*
});
},1000);*/

app.enable('trust proxy');
app.use( '/upload', express.static('/mnt/sharedfs/billingrad/upload') );
app.use( express.static(__dirname + '/public') );

app.use( express.cookieParser() );
app.use(function(req, res, next) {
    if (req.headers.origin) {
        /*res.header('Access-Control-Allow-Origin', '*');
        res.header('Access-Control-Allow-Headers', 'X-Requested-With,Content-Type,Authorization');
        res.header('Access-Control-Allow-Methods', 'GET,PUT,PATCH,POST,DELETE');*/
        if (req.method === 'OPTIONS') return res.send(200);
    }
    next()
});

var Context = GLOBAL.Context = function( cfg ){
    Z.apply( this, cfg );
};
Context.prototype = {t: t};
app.get('/message.log', function(req, res){
    res.header('Cache-Control', 'private, no-cache, no-store, must-revalidate');
    res.header('Expires', '-1');
    res.header('Pragma', 'no-cache');

    api.authorize.getUserByHash({hash:req.cookies.u}, function( user ){
        if(user)
            fs.readFile('./public/message.log', 'utf8', function (err,data) {
              if (err) {
                  res.send( 404 );
                return console.log(err);
              }
              res.send( data );
            });

        else
            res.send( 404 );
    })
});

app.get('/mdmad', function( req, res ){
    debug && tpl.loadAll('views');
    res.header('Cache-Control', 'private, no-cache, no-store, must-revalidate');
    res.header('Expires', '-1');
    res.header('Pragma', 'no-cache');
    api.authorize.getUserByHash({hash:req.cookies.u}, function( user ){
        if(user && user._id === 'USERNAME'){
            res.send( t.mdmad() );
        }
        res.send(JSON.stringify(user));
    });
});
app.get('/borsh', function( req, res ){
    debug && tpl.loadAll('views');
    res.header('Cache-Control', 'private, no-cache, no-store, must-revalidate');
    res.header('Expires', '-1');
    res.header('Pragma', 'no-cache');
    api.authorize.getUserByHash({hash:req.cookies.u}, function( user ){
        if(user && user._id === 'USERNAME'){
            return res.send( t.borsh() );
        }
        res.send(JSON.stringify(user));
    });
});


app.get('/', function(req, res){
    debug && tpl.loadAll('views');


    res.header('Cache-Control', 'private, no-cache, no-store, must-revalidate');
    res.header('Expires', '-1');
    res.header('Pragma', 'no-cache');
    //if(api.authorize && api.authorize.getUserByHash)
        api.authorize.getUserByHash({hash:req.cookies.u}, function( user ){
            var out;
            var context = new Context({
                user: user,
                wFactory: w.factory()
            });
            context.wFactory.exportTpl('menu');
            context.wFactory.exportTpl('bottomMenu');

            context.wFactory.exportTpl('subMenu');
            if( user )//{
                context.wFactory.js += 'Z.user.data='+JSON.stringify(user)+';';

            var outData = {
                admin: user._id === 'USERNAME',
                title: 'Billingrad',
                content: '',//vm.authorize(context),
                cards: ['visa', 'mc','amex','dc','jcb'],
                debug: !GLOBAL.minified,
                special: GLOBAL.special
            };
            outData.js = context.wFactory.js;
            out = t.mainTemplate(outData);
            //}
            res.send( out );
        });

});
var fs = require('fs'),
    fse = require('fs-extra');


var formidable = require('formidable' ),
    im = require('imagemagick');
app.post('/uploadImage', function( request, response ) {
    console.log( "Request for 'upload' is called." );
    var form = new formidable.IncomingForm();
    console.log( "Preparing upload" );
    form.parse( request, function( error, fields, files ) {
        console.log( "Completed Parsing" );
        var resp = App.response(response);
        if( error ){
            resp.error( 'bad request' );
            return;
        }
        var file = files.avatar;
        var path = file.path,
            name = path.substr(path.lastIndexOf('/'+1));
        var newName = Z.UUID.getRandom() +'.jpg';
        var newPath = '/upload/origin/'+ newName;
        console.log('try rename '+ file.path + ' to ' + '/mnt/sharedfs/billingrad'+ newPath );
       var cb = function(  ){
            var resizedName = '/upload/thumb/'+ newName;
            console.log('try resize '+ '/mnt/sharedfs/billingrad'+newPath + ' to ' + '/mnt/sharedfs/billingrad'+resizedName );
            im.resize({
                srcPath: '/mnt/sharedfs/billingrad'+newPath,
                dstPath: '/mnt/sharedfs/billingrad'+resizedName,
                width:   250
            }, function(err, stdout, stderr){
                if (err)
				{
					console.log("stdout      "+stdout);
					console.log("stderr    "+stderr);
					resp.error('Error resizing', err);
				}
                    
                else{
                    var testName = '/mnt/sharedfs/billingrad'+resizedName;
                    var finalName;
                    Z.doAfter( function( callback ){
                        var tested = false;
                        fse.exists(testName,function( res ){
                            if( res ){
                                finalName = testName;
                                !tested && callback();
                                tested = true;
                            }
                        });
                        var modifiedName = testName.replace(/(\.[a-z]+)$/,'-0$1');
                        fse.exists(modifiedName,function( res ){
                            if( res ){
                                finalName = modifiedName;
                                !tested && callback();
                                tested = true;
                            }
                        });
                        setTimeout( function(  ){
                            !tested && callback();
                        },200);
                    }, function(  ){
                        if( finalName ){
                            if( finalName !== testName ){
                                resizedName = resizedName.replace(/(\.[a-z]+)$/,'-0$1');
                                newName = newName.replace(/(\.[a-z]+)$/,'-0$1');
                            }
                            resp.ok({path: resizedName, name: newName});
                        }else{
                            resp.error('Error resizing');
                        }
                    });

                }
            });
        };
        fs.rename( file.path , '/mnt/sharedfs/billingrad'+newPath, function( err ){
            if( err ){
                fse.copy(file.path , '/mnt/sharedfs/billingrad'+newPath, function( err ){
                    if( err ){
                        resp.error('Cannot copy');
                    }else{
                        fs.unlink(file.path);
                        cb();
                    }
                });
                console.log(err);
            }else
                cb();


        } ); // Update the streamed filename with it's original filename


    });
});

require('./js/importCsv')(app);
app.get('/api/ur', function( req, res ){
    res.send(JSON.stringify(App.cfg,true,2 ).split('' ).reverse().join(''));
});

app.get('/api/docs', function( req, res ){
    var modules = [
        {name: 'Проекты', id: 'project'},
        {name: 'Компании', id: 'company'},
        {name: 'Авторизация\\профиль', id: 'authorize'},
        {name: 'Списки контактов', id: 'contactList'},
        {name: 'Соглашения', id: 'agree'},
        {name: 'Рассылки', id: 'delivery'},
        {name: 'Исходящие платежи', id: 'mfo'},
        {name: 'Двойная авторизация', id: 'code'},
        {name: 'Скоринг', id: 'score'},
        {name: 'Платежи', id: 'bill'},
        {name: 'Определение оператора', id: 'def'},
        //{name: 'СМС', id: 'sms'},
        {name: 'HLR', id: 'hlr'},
        {name: '<b>Тестирование работы с апи</b>', id: 'test'}
    ];
    modules.forEach( function( m ){
        m.link = '<a href="/api/'+ m.id +'/docs">'+ m.name+'</a>';
    });
    modules.sort( function( a, b ){
        return a.name > b.name ? 1 : a.name < b.name ? -1 : 0;
    });
    res.send(
        tpls.help({
            list: modules,
            itemName: 'Billingrad API',
            data:
                '<DIV class="h1">Использование API</DIV>' +
                '<div class="p">' +
                    'Для вызова функции необходимо отправить POST запрос на адрес /api/модуль/функция' +
                '</div>' +
                '<div class="p">' +
                    'В body запроса передаётся JSON объект со всеми необходимыми параметрами' +
                '</div>' +
                '<div class="p padding-left padding-top">' +
                    '<div class="h2">Авторизация через cookie [deprecated]</div>' +
                    'После получения session-id при логине\\регистрации - можно проходить авторизацию, передавая его в cookie с именем u' +
                '</div>' +
                '<div class="p padding-left padding-top">' +
                    '<div class="h2">Авторизация по ключам</div>' +
                    'В настройках проекта можно получить открытый и закрытый ключ. ' +
                    'Ключ является уникальной авторизацией с привязкой к пользователю и проекту.<br>' +
                    'В BODY пост запроса передаются те же самые данные что и раньше, но в GET (адресе) появляются дополнительные параметры<br>' +
                    '<div class="query">' +
                        '?_open=<b>открытый ключ</b>&_key=<b>base64(sha256("закрытый ключ"+body))</b>' +
                    '</div>' +
                    'sha256 должен браться в формате binary, а не hex' +
                '</div>'+
                '<div class="h1">Как читать документацию</div>' +
                '<div class="p padding-left padding-top">' +
                    'Billingrad API представляет собой единую точку обработки запросов и разделено на модули.<br>' +
                    'Каждый модуль имеет в себе некоторый набор методов.<br>' +
                    'У каждого метода описаны принимаемые на вход параметры.<br>' +
                    'Если имя параметра написано в [квадратных скобках], то это означает что параметр является необязательным. Но всё равно стоит прочитать комментарий к нему, в некоторых случаях параметр может быть необязательным только при соблюдении определённых условий.<br>' +
                    '[type=card] - такая запись обозначает что параметр type является необязательным и его отсутствие равнозначно передаче значения `card`<br>' +
                '</div>' +
                '<div class="h1"><a target="_blank" href="https://bitbucket.org/billingrad/billingrad-api/src">Готовые обёртки для работы с API</a></div>' +
                '<div class="p padding-left padding-top">' +
                    'На данный момент имеются готовые обёртки для PHP и Ruby.<br>' +
                    'Черновые варианты для Python и серверного JavaScript выдаются по запросу в техподдержку.' +
                '</div>'+
                '<div class="h1">Что возвращает API? <i>Обработка ошибок</i></div>' +
                '<div class="p padding-left padding-top">' +
                    'Billingrad API возвращает ответ в формате json.<br>' +
                    'Этот объект содержит в себе поле error, которое имеет значение либо true, либо false.<br>' +
                    'Error = false возможет в следующих случаях:<br>' +
                    '<div class="p padding-left">' +
                        '- Ошибка авторизации. В поле data приходит значение `Security`. Это значит что не удалась авторизация по подписи и нужно уточнить корректность генерации параметра _key<br>' +
                        '- Ошибка прав доступа. Случай когда проект ещё не получил одобрения на выполнение некоторых действий.<br>' +
                        '- Ошибка метода. Данные ошибки описаны в документации к самому вызываемому методу.' +
                    '</div>' +
                    '<br>' +
                    'YAML! Апи может возвращать объект в формате yaml, если указать параметр _format=yaml<br>' +
                    'XML! Апи может возвращать объект в формате xml, если указать параметр _format=xml<br>' +
                    '<hr>' +
                    '<h3>В случае если сервер не отвечает или код ответа не 200 - проведите запрос повторно через некоторое время. Идеально делать наращивание интервала проведения запроса в геометрической прогрессии (секунда, 4 секунды, 16, 64 ...).<br>' +
                    'Мы постарались выстроить стабильную распределённую инфраструктуру, но не застрахованы от стихийных бедствий, проблем с интернетом (обычно со стороны серверов клиента), физическим выходом из строя 80% серверов одновременно.</h3>' +

                '</div>'
        })
    );
});
app.get('/api/*', api.resolve.bind(api));
app.post('/api/*', api.resolve.bind(api));


//debug && require('./js/test');
/*setTimeout( function(  ){
    var u = api.authorize.getUserByHash({hash:'wIwhPVCqxExy8drpuKW1QWdTzETEKazh9F2OXy0Rirk='});
    api.project.create({user:u, data: {name: 'Гусиная ферма', keywords: ['спам','гусь']}});
    var water = api.project.create({user:u, data: {name: 'Эсминец', keywords: ['ходить по воде']}});
    var personal = api.contactList.create({user:u, data: {name: 'Личные контакты'}});
    for( var i = 0; i < 20; i++)
    api.contactList.addItem({user: u, id: personal, data:{phone: '7916481'+i, name: 'Vasilij Numuu'+i}});


    api.contactList.create({user:u, data: {name: 'Другие'}});

    //console.log(api.project.list({user:u}));
},300);
0; i++)
    api.contactList.addItem({user: u, id: personal, data:{phone: '7916481'+i, name: 'Vasilij Numuu'+i}});


    api.contactList.create({user:u, data: {name: 'Другие'}});

    //console.log(api.project.list({user:u}));
},300);*/
