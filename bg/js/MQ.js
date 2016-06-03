require('./Z');
console.log('connect to mq');// debug?"localhost":'192.168.150.8'5672
var amqp = require('amqp'),
    connection = amqp.createConnection({ host: App.cfg.rabbit.host, port: parseInt(App.cfg.rabbit.port) } ),
    //'p-mq1.blgrd.net'
    connected = false;
connection.setMaxListeners(100);

var mq = Z.MQ = {
    _q: {},
    _send: function( chanel, data ){
        var q = this._q;
        (q[chanel] || (q[chanel] = [])).push(data);
    },
    send: function( chanel, data, id ){

        this._send( chanel, {data: data, id: id} );

    },
    connected: function( callback ){
        if( connected )
            callback();
        else
            connection.on('ready', function(  ){
                //console.log('connected');
                connected = true;
                callback();
            });
    },
    subscribe: function( chanel, callback, full, after, autoDelete ){

        var out = {};
        this.connected( function(  ){
            //console.log('subscribing '+ chanel);
            connection.queue(chanel, {autoDelete: !!autoDelete}, function(queue){
                var consumerTag;
                queue.bind('#');

                queue
                    .subscribe(function (message) {
                        var data = unescape(message.data); // wtf
                        data = JSON.parse(data);
                        callback( full ? data : data.data );
                    })
                    .addCallback(function(ok) {
                        consumerTag = ok.consumerTag;
                        after && after();
                    });
                out.remove = function(){
                    queue.unsubscribe(consumerTag);
                    queue.destroy();
                }
            });
        });
        return out;
    },
    request: function( channel, data, callback ){
        var listenTo = Z.UUID.getRandom(),
            listener = this.subscribe( listenTo, function( data ){
                callback(data);
                listener.remove();
            }, true, function(  ){
                this._send( channel, {type: 'request', data: data, response: listenTo} );
            }.bind(this));

    },
    apiRequest: function( module, fn, data, callback, timeout ){

        var listenTo = Z.UUID.someRandom(),

            removed = false;

        replay.bind(listenTo, callback)

        this._send( 'api.'+module, {
            fn: fn,
            type: 'apiRequest',
            data: data,
            r: replay.rpcQueueName,
            c: listenTo
        } );
        timeout = timeout || 20000;

        setInterval( function(  ){
            delete replay._q[listenTo];
        },timeout)


    },
    Util: function( data ){
        this.r = data.r;
        this.c = data.c;
    }
},
    os = require('os'),
    replay = {
        bind: function( id, fn ){
            this._q[id] = fn;
        },
        _q: {},
        rpcQueueName: os.hostname() + ':' + process.pid,
        sorting: function( data ){
            var fn = replay._q[data.c];
            if(fn){
                fn(data.data);
                delete replay._q[data.c];
            }
        },
        init: function(){
            mq.connected( function(  ){
                mq.subscribe(replay.rpcQueueName,replay.sorting,true,void 0,true);
            } );
        }
    };
replay.init();


Z.MQ.Util.wait = function(){};
Z.MQ.Util.prototype = {
    wait: new Z.MQ.Util.wait,
    ok: function( data ){
        this.answer( data, false );
    },
    error: function( data ){
        this.answer( data, true );
    },
    answer: function( data, error ){
        Z.MQ._send( this.r, {error: error || false, c: this.c, data: data, time: +new Date()});
    }
};

mq.connected(function(){
    mq._send = function( chanel, data ){
        var json = JSON.stringify(data);
        connection.publish(chanel, json);
    };
    var q = mq._q, i, queue, j, _j;
    for( i in q )
        if( q.hasOwnProperty( i ) ){
            for( j = 0, queue = q[i], _j = queue.length; j < _j; j++ )
                mq._send( i, queue[j] );
            delete q[i];
        }
});