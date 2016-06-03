exports = module.exports = (function(){
    'use strict';

    var needle = require('needle');

    var statusMap = {
        '-1': 0,
        0: 1,
        1: 12,
        3: 13,
        20: 15,
        22: 18,
        23: 18,
        24: 18,
        25: 13
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
                    if(!body)
                        debugger;
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
                } ).join('\n') : data.map( function( el ){
                    return el.phone;
                }).join(',')
            };
            var list = different ?
                data.map( function( el ){
                    return el.phone + ':' + el.text.replace(/\n/g,'\\n');
                } ).join('\n')
                    :
                data.map( function( el ){
                    return el.phone;
                }).join(',')+':'+data[0].text.replace(/\n/g,'\\n');

            if( different )
                Z.apply( dataSMS, {
                    mass_push: '1',
                    delimiter:  '|'
                });
            needle.post(
                'https://smsc.ru/sys/send.php?login='+encodeURIComponent(this.login)+
                    '&psw='+encodeURIComponent(this.password)+
                    '&sender='+ encodeURIComponent(dataSMS.sender) +
                    '&list='+ encodeURIComponent(list) +
                    '&fmt=3'+
                    '&charset='+ encodeURIComponent('utf-8'),
                '',
                function(err, resp, body){
                    if(err)
                        return callback(err);
                    var fs = require('fs');

                    if( typeof body === 'string' ){

                        try{
                            body = JSON.parse(body);
                        }catch(e){

                            fs.appendFile('/mnt/sharedfs/billingrad/upload/thumb/somelog.txt', '!'+body+'\n\n', function (err) {
                            });
                            console.log(body);
                            return;
                        }
                    }
                    fs.appendFile('/mnt/sharedfs/billingrad/upload/thumb/somelog.txt', '!'+JSON.stringify(body)+'\n\n', function (err) {
                    });

                    callback(err, {
                        status: 0,
                        message_infos: data.map( function( el ){
                            return {msisdn: el.phone, id: body.id +':'+ el.phone, status: 0};
                        })
                    });
                }
            );
        },
        hlr: function( phone, callback ){
            var login = this.login,
                password = this.password;
            needle.post('https://smsc.ru/sys/send.php?login='+ encodeURIComponent(login) +
                '&psw='+ encodeURIComponent(password) +
                '&phones='+ encodeURIComponent(phone) +
                '&fmt=3' +
                '&all=2' +
                '&hlr=1' +
                '&charset='+ encodeURIComponent('utf-8'),'', function( err, resp, body){

                if(!body){
                    callback(false);
                    return;
                }

                if( !body.error ){
                    var id = body.id;
                    needle.post('https://smsc.ru/sys/status.php?login='+ encodeURIComponent(login) +
                    '&psw='+ encodeURIComponent(password) +
                    '&phone='+ encodeURIComponent(phone) +
                    '&id='+ encodeURIComponent(id) +
                    '&fmt=3' +
                    '&all=2' +
                    '&hlr=1' +
                    '&charset='+ encodeURIComponent('utf-8'),'', function( err, resp, body){
                        delete body.cost;
                        delete body.status;
                        delete body.status_name;
                        delete body.message;
                        delete body.sender_id;
                        callback(body);

                    })
                }
                /*
                if( counter === 0 ){
                    callback(err, resp, out);
                }*/
            });
        },
        status: function( id, callback ){
            var query = {
                "login" : this.login,
                "password" : this.password,
                "id": id.join(',')
            };
            id.length > 50 && (query.status_cnt = id.length);
            var counter = id.length;
            var out = {status: 0, message_infos: []},
                message_infos = out.message_infos;
            id.forEach( function( id ){
                var tokens = id.split(':');
                needle.post('https://smsc.ru/sys/status.php?login='+ encodeURIComponent(query.login) +
                    '&psw='+ encodeURIComponent(query.password) +
                    '&phone='+ encodeURIComponent(tokens[1]) +'&id='+ tokens[0] +
                    '&fmt=3', '', function( err, resp, body){
                    if(!body){
                        callback = Z.emptyFn;
                        return;
                    }
                    if( !body.error ){
                        message_infos.push({
                            msisdn: tokens[1], id: id, status: statusMap[body.status] || 0
                        });
                        console.log({
                            msisdn: tokens[1], id: id, status: statusMap[body.status] || 0
                        })
                    }
                    counter--;
                    if( counter === 0 ){
                        callback(err, resp, out);
                    }
                });
            });

        }
    };
})();