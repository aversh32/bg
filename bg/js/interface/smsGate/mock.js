exports = module.exports = (function(  ){
    var clc = require('cli-color');
    var good = clc.greenBright;
    var m = (Math.random()*1000000000000)|0;
    var hash = {};
    var getStatus = function(  ){
        return (Math.random()<0.9?(Math.random()<0.5?0:1):(Math.random()<0.8?12:15));
    };
    return {
        normalSend: function( from, data, callback ){
            var i, _i, lastText, text,
                different = false,
                hash = Z.makeHash(data,'phone');

            for( i = 0, _i = data.length; i < _i; i++ ){
                text = data[i].text;
                if( i > 0 && lastText !== text ){
                    different = true;
                    break;
                }
                lastText = text;
            }

            this.interface.send.call(
                this,
                data,
                'sender' in this ? this.sender : from,
                different, function(err, body){
                    if( body.status < 0 ){
                        callback(err,body);
                        return;
                    }


                    body.message_infos.forEach( function( el ){
                        var msg = hash[el.msisdn];
                        msg.status = el.status;
                        msg.gateId = el.id;
                    });
                    callback(err, data);
                });
        },
        send: function( data, sender, different, callback ){
            setTimeout( function(  ){
                var err = void 0;
                var body = {status: 0, error: false, message_infos: data.map( function( el ){
                    console.log(good(el.phone+': '+el.text));
                    m++;
                    hash[m] = el.phone;
                    return {msisdn: el.phone, id: m, status: getStatus()};
                })};
                callback(err, body);

            }, Math.random()*1000+200);
        },
        status: function( id, callback ){
            setTimeout( function(  ){
                var query = {
                    "login" : this.login,
                    "password" : this.password,
                    "id": id.join(',')
                };
                id.length > 50 && (query.status_cnt = id.length);
                var err = void 0, resp = {}, body = {
                    status: 0,
                    error: false,
                    message_infos: id.map( function( el ){
                        return {msisdn: hash[el], id: el, status: getStatus()};
                    })
                };
                console.log(body);
                callback(err, resp, body);
            });
        }
    }
})();