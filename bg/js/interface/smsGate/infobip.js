
exports = module.exports = (function(){
    'use strict';
    var debug = GLOBAL.debug;
    var db = Z.pg.use('infobip');
    require(App.base+'/public/js/lengthCounter');
    var xmlParser = require('xml2js');
    var to10 = function (el) {
        if(el === '')
            return '';
        var out = parseInt(el,36)+'';

        return out.length < 9 ? new Array(10-out.length).join('0')+out: out;
    };
    var GATEID = {
        parse: function (id) {
            id = (id + '').split('-');
            return id.map(to10).join('');
        },
        stringify: function (id) {
            id = id + '';
            var end = id.substr(9);

            return parseInt(id.substr(0,9)).toString(36) +'-'+ (end===''?'':parseInt(end).toString(36));
        }
    };
    var needle = require('needle');
    var curl = require('tinycurl');
    var statusRequest = {
        ALL_RECIPIENTS_PROCESSED: 0,
        SEND_ERROR: -1,
        NOT_ENOUGH_CREDITS: -2,
        NETWORK_NOTCOVERED: -3,
        INVALID_USER_OR_PASS: -5,
        MISSING_DESTINATION_ADDRESS: -6,
        MISSING_USERNAME: -10,
        MISSING_PASSWORD: -11,
        INVALID_DESTINATION_ADDRESS: -13,
        SYNTAX_ERROR: -22,
        ERROR_PROCESSING: -23,
        COMMUNICATION_ERROR: -26,
        INVALID_SENDDATETIME: -27,
        INVALID_DELIVERY_REPORT_PUSH_URL: -28,
        INVALID_CLIENT_APPID: -30,
        DUPLICATE_MESSAGEID: -33,
        SENDER_NOT_ALLOWED: -34,
        GENERAL_ERROR: -99,
        DELIVERED: 1,
        EXPIRED: -1
    };
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
    var crypto = require('crypto');
    var checkers = {};
    var writing = function (err, resp) {
        xmlParser.parseString(resp, function (err, data) {
            if (err)
                return ;

            var body = data &&
                data.DeliveryReport &&
                data.DeliveryReport.message;

            if(body && body.forEach){
                body.forEach(function (el) {
                    el = el && el.$;
                    console.logModule('infobip', 'status cb', el.id, el.status, statusRequest[el.status]);
                    db.edit('infobip', el.id, {
                        status: el.status in statusRequest ? statusRequest[el.status] : -1 ,
                        doneDate: el.donedate
                    }, function (err) {
                        if(err)
                            console.log('infobip', 'errorUpdateStatus', err)
                    });
                });
            }
        });

    };
    var statusCheckSequence = function (recall) {
        //console.log('#ib#ch#');
        var auth = this.login+':'+this.password,
            recheckTime = Math.random()<0.8 ? 1000*60*15 : 1000*60*60*48;
        if (checkers[auth] || recall)
            return;
        var shasum = crypto.createHash('sha256');
            shasum.update( auth, 'utf8' );
            shasum = shasum.digest('base64');
            //console.log('#ib#ch#sha ', shasum);
        App.action('IB0'+shasum.replace(/[^a-zA-Z0-9]/g,''), 1000*60*3, function(err, data) {
            //debugger;
            //console.log('#ib#ch#inside');

            curl.get('https://api.infobip.com/sms/1/logs?sentSince=' + encodeURIComponent((new Date(+new Date() - recheckTime)).toISOString()),
                {
                    'u': auth,
                    headers: [
                        'Content-type: application/json; charset=utf-8'
                    ]
                }, function (err, resp) {
                    try {
                        var result = JSON.parse(resp).results;
                        //console.log('#ib#ch#inside#ans', result.length);
                        result.forEach(function (el) {
                            el.status = el.status && el.status.groupName;
                            //console.log('#ib#ch#stat', el.messageId, '=>', el.status, el.status in statusRequest ? statusRequest[el.status] : -1);
                            if (!el.messageId)
                                return;
                            db.edit('infobip', el.messageId, {
                                status: el.status in statusRequest ? statusRequest[el.status] : -1,
                                doneDate: el.sentAt
                            }, function (err) {
                                if (err)
                                    console.log(err);
                            });
                        });

                    } catch (e) {
                        console.log('someshit', e);
                    }


                }
            );
        }.bind(this));

        checkers[auth] && clearTimeout(checkers[auth]);
        checkers[auth] = setTimeout(function () {
            delete checkers[auth];
            statusCheckSequence.call(this, true);
        }.bind(this), 1000*60*3.1);
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
                    if(!body){
                        setTimeout( function(  ){
                            this.interface.normalSend.call(this, from, data, callback);
                        }.bind(this), 1000);
                        return;
                    }

                    if( body.status < 0 || !body.results || !body.results.forEach ){
                        callback(err,body);
                        return;
                    }
                    //console.log('1!!', body);
                    //console.log(hash);
                    body.results.forEach( function( el ){
                        //console.log(el)
                        var msg = hash[el.destination];
                        msg.status = el.status;
                        if((!el.messageid || parseInt(el.messageid,10) < 200) && el.status)
                            el.messageid = GATEID.parse('azzzzz-'+
                                (Math.random()*36|0).toString(36)+
                                (Math.random()*36|0).toString(36)+
                                (Math.random()*36|0).toString(36)+
                                (Math.random()*36|0).toString(36)+
                                (Math.random()*36|0).toString(36)+
                                (Math.random()*36|0).toString(36)
                            );
                        msg.gateId = GATEID.stringify(el.messageid);

                    });
                    var wtf = body.results.map(function (el) {
                        var record = {
                            gateId: el.messageid,
                            status: el.status,
                            phone: el.destination
                        };
                        //console.logModule('infobip', 'after send', record);
                        return record;
                    });
                    db.add('infobip', wtf, function (err, result) {
                        //console.log('#ib#add to db', err, JSON.stringify(result), JSON.stringify(wtf));
                        callback(err, data);
                    });

                });
        },
        send: function( data, sender, different, callback ){
            callback = callback || different;
            if( typeof callback !== 'function' )
                callback = function(){};

            var list;
            if( different )
                list = data.map( function( el ){
                    return el.phone + ':' + el.text.replace(/\n/g,'\\n');
                } ).join('\n')
            else {
                var text = data && data[0] && data[0].text || '';
                list = data.map(function (el) {
                    return el.phone;
                }).join(',') + ':' + text.replace(/\n/g, '\\n');
            }



            var dataSMS = {
                authentication: {
                    username: this.login,
                    password: this.password
                },
                messages: different ? data.map(function (el) {
                    return {
                        sender: sender||'billingrad',
                        text: el.text,
                        recipients: [
                            {gsm: el.phone}
                        ]
                    };
                }):[
                    {
                        sender: sender||'billingrad',
                        text: text,
                        recipients: data.map(function (el) {
                            return {gsm: el.phone};
                        })
                    }
                ]

            };
            if( different )
                Z.apply( dataSMS, {
                    mass_push: '1',
                    delimiter:  '|'
                });

            var flash = this.flash;
            dataSMS.messages.forEach(function (m) {
                var l = smsLength(m.text+'');
                l[0] > 1 && (m.type='longSMS');
                m.datacoding = flash?(l[2]?240:24):(l[2] ? 0 : 8);
                if(flash)m.flash = true;
            });
            var dat = JSON.stringify(dataSMS);
            //console.log('#ib#send', dat);
            curl.post('http://api.infobip.com/api/v3/sendsms/json',{
                    headers: [
                        'Content-type: application/json; charset=utf-8',
                        'Content-Encoding:UTF-8'
                    ],
                    data: dat
                },
                function(err, body){
                    console.logModule('#ib#answer', 'send answer',err, body);
                    if(body) err = false;
                    if(err)
                        return callback(err);

                    if( typeof body === 'string' ){

                        try{
                            body = JSON.parse(body);
                        }catch(e){
                            //console.log(body);
                            return;
                        }
                    }

                    callback(err, body);
                }
            );
        },
        status: function( id, callback ){

            if( debug ) {
                console.log('INFOBIP, status not checking (debug)');
                return;
            }
            statusCheckSequence.call(this);
            // not debug
            //console.log('INFOBIP, status');
            var query = {
                "login" : this.login,
                "password" : this.password
            };

            // copy ids
            var idOriginal = id.slice();

            var out = {status: 0, message_infos: []},
                message_infos = out.message_infos,
                sliceLength = 50;
            //var counter = Math.ceil(id.length/sliceLength);

            curl.get('http://api.infobip.com/api/v3/dr/pull?'+
                'user='+ encodeURIComponent(this.login)+
                '&password='+ encodeURIComponent(this.password),
                {
                    headers: [
                        'Content-type: application/xml; charset=utf-8'
                    ]
                }, function( err, resp){
                    //console.logModule('#ib#status',resp);
                    var lid, f0, stats;
                    // LOGGING
                    Z.doAfter(function (callback) {
                        // dump to db;
                        db.add('log', {
                            createDate: new Date(),
                            recieve: resp
                        }, function( err, result ){
                            if( err ){
                                console.log(err.toString());
                            }else{
                                lid = result.lid;
                                callback();
                            }
                        });
                    }, function (callback) {
                        // set f0 as 'next'
                        f0 = function (data) {
                            stats = data;
                            callback();
                        }
                    }, function () {
                        // write statuses to logstat
                        stats.forEach(function (el) {
                            el = el && el.$;
                            db.add('logstat', {
                                lid: lid,
                                gateId: el.id
                            });
                        });
                    });
                    // /LOGGING

                    Z.doAfter(function (cb) {
                        if (!resp) {
                            //callback = Z.emptyFn;
                            return cb();
                        }

                        if (resp === 'NO_DATA') {
                            return cb();
                        } else {
                            xmlParser.parseString(resp, function (err, data) {
                                if (err)
                                    return cb();

                                var body = data &&
                                    data.DeliveryReport &&
                                    data.DeliveryReport.message;

                                if(body && body.forEach){
                                    var l = body.length;
                                    body.forEach(function (el) {
                                        el = el && el.$;
                                        //console.logModule('infobip', 'status ',el.id,el.status);
                                        db.edit('infobip', el.id, {
                                            status: el.status in statusRequest ? statusRequest[el.status] : -1 ,
                                            doneDate: el.donedate
                                        }, function (err) {
                                            if(err)
                                                console.log('infobip', 'errorUpdateStatus', err)
                                            l--;
                                            !l && cb();
                                        });
                                    });
                                    f0(body);
                                }else{
                                    cb();
                                }

                            });
                        }
                    }, function () {
                        db.getList('infobip','gateId', idOriginal.map(GATEID.parse), function (list) {
                            if(list && list.forEach)
                                list.forEach(function (el) {
                                    //console.logModule('infobip',el.phone, el.gateId,GATEID.stringify(el.gateId),el.status,statusMap[el.status]);
                                    message_infos.push({
                                        msisdn: el.phone,
                                        id: GATEID.stringify(el.gateId),
                                        status: (el.status < 0 ? 18 :(statusMap[el.status] || 0))+''
                                    });
                                });
                            else
                                console.log(list);

                            callback.call(this, false, resp, out);
                        });

                    });
                });

            /*while(id.length){
                var ids = id.splice(0,sliceLength);
                console.log(ids);
                (function (ids) {
                curl.get('http://api.infobip.com/api/v3/dr/pull?'+
                    'user='+ encodeURIComponent(this.login)+
                    '&password='+ encodeURIComponent(this.password)+
                    '&messageid='+ encodeURIComponent(ids.map(GATEID.parse).join(',')), {
                    headers: [
                        'Content-type: application/xml; charset=utf-8'
                    ]
                }, function( err, resp){
                    console.logModule('infobip',resp);
                    Z.doAfter(function (cb) {
                        if (!resp) {
                            //callback = Z.emptyFn;
                            cb();
                            return;
                        }

                        if (resp === 'NO_DATA') {
                            cb();
                        } else {
                            xmlParser.parseString(resp, function (err, data) {
                                if (!err) {
                                    var body = data && data.DeliveryReport && data.DeliveryReport.message;
                                    if(body && body.forEach){
                                        var l = body.length;
                                        body.forEach(function (el) {
                                            el = el && el.$;
                                            db.edit('infobip', el.id, {
                                                status: statusRequest[el.status],
                                                doneDate: el.donedate
                                            }, function () {
                                                l--;
                                                if(!l)cb();
                                            });
                                        });
                                    }else{
                                        cb();
                                    }
                                }else{
                                    cb();
                                }
                            });
                        }
                    }, function () {
                        counter--;
                        if (counter === 0) {
                            db.getList('infobip','gateId', idOriginal.map(GATEID.parse), function (list) {
                                list.forEach(function (el) {
                                    message_infos.push({
                                        msisdn: el.phone, id: GATEID.stringify(el.gateId), status: statusMap[el.status] || 0
                                    });
                                });
                                callback.call(this, false, resp, out);
                            });

                        }
                    });
                });
                }).call( this, ids );
            }*/


        },
        push: function () {

        },
        callback: function (err, resp) {
            writing(err, resp);
        }
    };

})();
