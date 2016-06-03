exports = module.exports = (function(){
    'use strict';
    var curl = require('tinycurl');
    //var needle = require('needle');
    return {
        normalSend: function( from, data, callback ){
            /*
            data: [{phone, text, anything}]
            */
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
                    if(!body){
                        setTimeout( function(  ){
                            this.interface.normalSend.call(this, from, data, callback);
                        }.bind(this), 1000);
                        return;
                    }

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
            callback = callback || different;
            if( typeof callback !== 'function' )
                callback = function(){};

            var dataSMS = {
                "login" : this.login,
                "message" : different ? '' : data[0].text,
                "password" : this.password,
                "sender" : sender || 'billingrad',
                "target" : different ? data.map( function( el ){
                    return el.phone + ' ' + el.text;
                } ).join('|') : data.map( function( el ){
                    return el.phone;
                }).join(',')
            };
            if( different )
                Z.apply( dataSMS, {
                    mass_push: '1',
                    delimiter:  '|'
                });
            curl.post('http://auth.terasms.ru/outbox/send/json',{
                    headers: [
                        'Content-type: application/json; charset=utf-8'
                    ],
                    data: JSON.stringify(dataSMS)
                },
                function(err, body){
                    if(body) err = false;
                    if(err)
                        return callback(err);
                    var fs = require('fs');

                    if( typeof body === 'string' ){

                        try{
                            body = JSON.parse(body);
                        }catch(e){

                            /*fs.appendFile('/mnt/sharedfs/billingrad/upload/thumb/somelog.txt', '!'+body+'\n\n', function (err) {
                            });*/
                            console.log(body);
                            return;
                        }
                    }
                    /*fs.appendFile('/mnt/sharedfs/billingrad/upload/thumb/somelog.txt', '!'+JSON.stringify(body)+'\n\n', function (err) {
                    });*/
                    callback(err, body);
                }
            );

        },
        status: function( id, callback ){

            var query = {
                "login" : this.login,
                "password" : this.password,
                "id": id.join(',')
            };
            id.length > 50 && (query.status_cnt = id.length);
            curl.post('http://auth.terasms.ru/outbox/status/json/', {
                    headers: [
                        'Content-type: application/json; charset=utf-8'
                    ],
                    data: JSON.stringify(query)
                },
                function( err, body ){
                    if(body) err = false;
                    if( typeof body === 'string' ){

                        try{
                            body = JSON.parse(body);
                        }catch(e){
                            console.log(body);
                            return;
                        }
                    }
                    callback.call(this,err,{},body);
                }
            );
        }
    };
})();


