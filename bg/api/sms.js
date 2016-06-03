var i = 0;
require('../public/js/lengthCounter');
var needle = require('needle');
var connections = {};
var interfaces = Z.include('./js/interface/smsGate/', function(  ){
    connections = {};
    Z.each( App.cfg.smsGates, function( gate, cfg ){
        Z.each(cfg, function( name, cfg ){
            connections[name] = cfg;
            cfg.interface = interfaces[gate];
        });
    });
});



var codeConnection = 'infobip';//terasms';//'mock';

var getStatus = function( id, connection, callback ){
    id = Z.makeArray(id);
    if( id.length > 2000 )
        id = id.slice(2000);
    var connect = connections[connection];
    connect.interface.status.call(connect, id, callback);
};

var store,
    lastChecked,
    queue = {},
    delay = 15,
    дык = false,

startStatusCheck = function(){
        if( !lastChecked || lastChecked <= (new Date()-delay*60) ){

            if( !lastChecked ){
                store.getList('status', 0, function( list ){

                    queue = {};
                    list.forEach( function( el ){
                        queue[el.m] = el;
                    });
                    startStatusCheck();
                });
            }else{
                var lists = {};
                var isEmpty = true;
                Z.each(queue, function( k, v ){
                    isEmpty = false;
                    (lists[v.service] || (lists[v.service] = [])).push( v.m );
                });
                if(!isEmpty)
                    console.log(lists);// : console.log((дык = !дык)?'тык':'дык');
                if( !isEmpty ){
                    Z.each( lists, function( key, list ){
                        getStatus(list, key, function( err, resp, body ){

                            if( body && body.status > -1 && body.message_infos && body.message_infos.forEach ){
                                body.message_infos.forEach( function( data ){
                                    if(parseInt(data.status,10) >= 10){
                                        var item = queue[data.id];
                                        if( item ){
                                            /*console.log(data);*/
                                            console.log('!update from '+item.status+' to '+ data.status);
                                            item.status = data.status;
                                            //item._id = item.id = item._id || item.id;
                                            store.edit( item );
                                            delete queue[item.m];
                                        }
                                    }
                                });
                            }
                        });
                    });
                }
            }
            lastChecked = new Date();
        }
        setTimeout(startStatusCheck, delay*1000);
    };
db.need('sms', function( storage ){
    store = storage;
    if(storage.isNew){
        console.log('create sms hashes');
        storage.index(['status', 'owner']);
    }else{
        startStatusCheck();
    }
    //storage.index(['status', 'owner']);
});
var formatPhone = function( text ){
    var phone = text.replace(/[\+\(\)\-]*/g,'');
    if( phone.charAt(0) === '8')
        phone = '7'+phone.substr(1);
    else if( phone.charAt(0) !== '7')
        phone = '7'+ phone;


    return {raw: phone, view: '+'+ phone.substr(0,1)+'('+ phone.substr(1,3) +')'+phone.substr(4,3)+'-'+phone.substr(7,2)+'-'+phone.substr(9,2)};

};
var subHash = {},
    cosher = require('z-redis-cosher');
var codesHash = new cosher({
    name: 'codesHash',
    idKey: 'id',
    timeout: 60*20,//20 hours
    connectCfg: App.cfg.redis,
    query: function( id, cb ){
        cb(subHash[id]);
    }
});


exports = module.exports = {
    getLog: function( owner, page, perPage, util ){
        store.getPage('owner', owner, page, function( data ){
            store.count('owner', owner, function( count ){
                data.total_rows = count;
                util.ok(data);
            });
        }, perPage);
        return util.wait;
    },
    getSendedCount: function( owner, util, user ){
        store.count('owner', owner, function( data ){
            util.ok(data);
        });
        return util.wait;
    },
    checkCode: function( phone, code, util ){
        if(!util.internal)
            return util.error(false);
        phone = formatPhone( phone ).raw;
        setTimeout( function(  ){
            codesHash.get(phone, function( err, obj ){
                if( obj && typeof obj.code === 'string' && obj.code.toLowerCase() === code.toLowerCase().trim() ){
                    util.ok('ok');
                }else{
                    util.error('wrong');
                }
            });
        },0);
        return util.wait;
    },
    sendCode: function( phone, text, util, manual, sjendir ){
        if(!util.internal)
            return util.error(false);
        phone = formatPhone(phone).raw;
        codesHash.get(phone, function( err, obj ){
            if( obj && obj.time + 60000 > +new Date() ){
                util.error( 'timeout' );
            }else{
                codesHash.remove(phone);
                obj = subHash[phone] = {time: +new Date(), code: Math.random().toString(10).substr(2,4)};

                codesHash.get(phone, function( err, obj ){
                    var connect = connections[codeConnection];
                    if( !manual )
                        connect.interface.send.call(
                            connect,
                            [{phone:phone,text:text.replace('{code}', obj.code)}],
                            sjendir || '',
                            false, function( err, body ){
                                if( err || body.status < 0 ){
                                    util.error('Error');
                                }else{
                                    util.ok('ok')
                                }
                        });
                });
                if( manual )
                    return util.ok(text.replace('{code}', obj.code));
            }
        });






        return util.wait;
    },
    statusCallback: function (data, util) {
        if(!util.internal)
            return false;
        connections.infobip.interface.callback(false, data);
    },
    justCheck: function( gate, ids, util ){
        var connect = connections[gate];
        if( !util.internal )
            return false;
        //console.logModule('SMS:justCheck', ids.slice(0,10),ids.length, gate);
        if( !connect ) {
            console.logModule('SMS:justCheck', 'no connection');
            return false;
        }

        var arr = Z.makeArray(ids);
        console.logModule('SMS:justCheck', 'Terasms check status for: '+arr.length, arr.slice(0,2));
        connect.interface.status.call(connect, arr, function( err, resp, body ){

            if( err ) {
                console.log('error status getting', err);
                return util.error(false);
            }

            var out = {};

            if( body && body.status > -1 ){
                if( body.message_infos )
                    body.message_infos.forEach( function( data ){
                        out[data.id] = parseInt(data.status,10);
                    });
                util.ok(out);
            }

        });
        return util.wait;
    },
    justSend: function( gate, from, data, util ){
        if( !util.internal )
            return false;


        var connect = connections[gate];
        if( !connect )
            return false;

        connect.interface.normalSend.call( connect, from, data, function( err, data ){
            if(err)
                return util.error('Error sending sms');

            util.ok(data);
        });

        return util.wait;
    },
    getConnections: function( util, user ){
        var out = {};
        for( var i in connections ){
            out[i] = connections[i].login;
        }
        return out;
    },

    send: function( id, to, text, from, user, util, calculate, doNotLog ){
        /*
        Отправить смс
        #in
            id: project-id - ID проекта, в рамках которого отправляется смс
            to: text - Список телефонов и имён (name) списков контактов, разделённый точкой с запятой (;)
            text: text - Текст сообщения
            from: text - sender
            [calculate]: boolean - Если true, то функция не будет отправлять смс, а только вычислит количество сегментов и проверит достаточно ли баланса
        #out
            #ok
                #comment
                    collect = true
                #js
                    {
                        targets: receiverCount,
                        count: partsCount,
                        price: totalPrice,
                        available: avaliableMoney
                    }

                #comment
                    collect = false (default). Вернёт количество поставленных в очередь на отправку сегментов
                {"count": n}
            #errors
                Internal error. Отсутствует баланс, привязанный к проекту
                #error
                    badBalance

                Проект с заданным id отсутствует
                #error
                    noSuchProject

                Префикс отсутствует в проекте
                #error
                    badPrefix

                Префикс не прошел одобрение
                #error
                    Not approved prefix

                Недостаточно денег
                #error
                    {text: 'Not enough money', info: {amount: projectBalance, sms: countSMSes}}

                Шлюз не может отправить смс
                #error
                    Error sending sms

         */
        var collectData = {formatTo: []};

        Z.doAfter( function( callback ){
                // get balance of sender
                api.balance.get({owner: id, from: id}, function( data ){
                    collectData.walletId = data.id;
                    if( !data ){
                        util.error('badBalance');
                        return ;
                    }
                    collectData.amount = data.amount;
                    callback();
                });
            },
            function( callback ){
                //get project data
                api.project.get({id: id, user: user}, function( data ){
                    if( !data ){
                        util.error('noSuchProject');
                        return;
                    }
                    collectData.gate = data.smsGate || 'terasms';
                    //for check of avaliability of sender
                    collectData.sender = from;
                    if( from !== 'billingrad' ){
                        var sender = data.sender.map( Z.getProperty('sender' ) ).indexOf(from);
                        if( sender === -1 ){
                            util.error('badPrefix');
                            return;
                        }else if( data.sender[sender].approved !== true ){
                            util.error('Not approved prefix');
                            return;
                        }else{
                            collectData.sender = data.sender[sender].sender;
                        }
                    }
                    collectData.singlePrice = data.smsPrice;
                    callback();
                });
            }, function( callback ){
                api.contactList.list({user: user}, function( lists ){
                    var hash = Z.makeHash(lists, 'name' ),
                        formatTo = [],
                        resolveCount = 0;
                    to.split(/[,;]/ )
                        .map( function( el ){
                            return el.trim();
                        } )
                        .filter( function( el ){
                            return el !== '';
                        } )
                        .forEach( function( el ){
                            if( hash[el] ){
                                resolveCount++;
                                api.contactList.get({user: user, id: hash[el].id}, function( el ){
                                    el.forEach( function( phone ){
                                        collectData.formatTo.push(phone);
                                    });

                                    !(--resolveCount) && callback();//doSend();
                                });
                            }else
                                collectData.formatTo.push({phone:el});
                        });
                    !(resolveCount) && callback();//doSend();

                } );
            }, function(  ){

                /*'target' => 'target1 message1|target2 message2|target3 message3',
                'message' => '',
                'sender' => 'sender',
                'mass_push' => '1',
                'delimiter' => '|'*/

                var target = collectData.formatTo,
                    tplFn = api.templater.template.detail.original,
                    smsHash = {}, countSMSes = 0, i, toLog = {};
                if( text.indexOf('{')> -1 && text.indexOf('}')>-1){
                    target = target.map( function( obj ){
                        var out = tplFn(text, obj);
                        smsHash[out] = (smsHash[out] || 0) + 1;
                        toLog[obj.phone] = {phone: obj.phone, text: out, service: collectData.gate, owner: id};
                        return {phone: obj.phone, text: out};
                    } );
                    var differentCount = 0;
                    for( i in smsHash ){
                        if( smsHash.hasOwnProperty(i) ){
                            differentCount++;
                            text = i;
                            countSMSes += smsLength(i)[0]*smsHash[i];
                        }
                    }
                }else{
                    differentCount = 1;
                    countSMSes = smsLength(text)[0] * target.length;
                    target.forEach( function( el ){
                        el.text = text;
                        toLog[el.phone] = {phone: el.phone, text: text, service: collectData.gate, owner: id};
                    });

                }
                var connect = connections[collectData.gate];


                if(calculate){
                    util.ok({
                        targets: target.length,
                        count: countSMSes,
                        price: Math.round(countSMSes*collectData.singlePrice)/100,
                        singlePrice: collectData.singlePrice,
                        available: collectData.amount
                    });
                    return;
                }

                if( countSMSes*collectData.singlePrice/100 > collectData.amount + 100 ){// TODO check
                    util.error({text: 'notEnoughMoney', info: {amount: collectData.amount, sms: countSMSes}});
                    return;
                }
/*
                console.dir(collectData);
                console.log('####')
                //console.log(data);
                console.log(dataSMS);
                util.ok();
                return;*/

                api.balance.transaction({
                        minus: 500,
                        id: collectData.walletId,
                        to: 'THEWALLET',
                        amount: countSMSes*collectData.singlePrice/100,
                        user: {_id: id}
                    },
                    function( data ){
                        connect.interface.send.call(connect,
                            target,
                            'sender' in connect ? connect.sender : collectData.sender,
                            differentCount > 1, function( err, body ){
                            if(err)
                                return util.error('Error sending sms');


                            if( body.status < 0 ){
                                util.error('Fail');
                                return;
                            }

                            body.message_infos.forEach( function( el ){
                                Z.apply(toLog[el.msisdn], {status: el.status, date: Z.getArrayDate(), m: el.id });
                            });
                            if(!doNotLog){
                                for( var i in toLog ){
                                    if( toLog.hasOwnProperty(i) ){
                                        (function( i ){
                                            store.add(toLog[i], function( a, b ){
                                                var el = toLog[i];
                                                el._id = b.id;
                                                el._rev = b.rev;
                                                queue[toLog[i].m] = el;
                                            });
                                        })(i);
                                    }
                                }
                                body.count = countSMSes;
                                util.ok(body);
                            }

                        });
                    }
                );



            });

        return util.wait;

    },

    sendSMS: function( to, text, dateFrom, dateTo, priority ){

    },/*
        *//*
         @visible
         string to | [string] to: phone number or array of them
         string text: text of message
         date dateFrom: message wouldn't be send before this date
         date dateTo: message wouldn't be send after this date
         int priority: 0-100: priority of request in queue
         *//*
        console.log(to,priority);
        var uid = i++;
        this.fire('sendSmsCalled', i );
        setTimeout( function(  ){
            this.fire('beforeSend', i );
            setTimeout( function(  ){
                this.fire('sending', i );
                setTimeout( function(  ){
                    this.fire( Math.random() < 0.8 ? 'delivered' : 'deliverFailed', i );
                }.bind(this), 20 );
            }.bind(this),20);
        }.bind(this),20);

        //return 66;
        *//*
         a

         *//*
        //b
    },*/
    income: function( text ){
        var tokens = text.split(/[\.\s]/);
    }

};