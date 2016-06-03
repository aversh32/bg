/*
кому: набор списков + телефоны + фильтрация - модуль контактов
создать рассылку
список сообщений в рассылке

postgre:
    list:
        lid, name, createDate, pid

    msg:
        mid, lid, status [create, sending, delivered],
            createDate, sendDate, finishDate,
            deliveredCount, failedCount, progressCount
    contacts:
        lid, phone, name, json
        lid, "name": 1, 2*/

(function(  ){
//    return false;

require('../public/js/lengthCounter');

var db = Z.pg.use('delivery');

//var match1 = Z.matcher({article_name: {endWith: '1'}});
/*var codes = {
    mts: '910-919,980-989',
    beeline: '903-906,909,960-968',
    megafon: '920-929,930-938,997'
};
var codeMap = {};
(function( codes, codeMap ){
    for( var i in codes ){
        if( codes.hasOwnProperty(i) ){
            var tokens = codes[i].split(',');
            tokens.forEach(function(el){
                if( el.indexOf('-') ){
                    var tokens = el.split('-');
                    for(var j = tokens[0], _j = tokens[1]; j <= _j; j++ ){
                        codeMap[j] = i;
                    }
                }else{
                    codeMap[el] = i;
                }
            });
        }
    }
})( codes, codeMap );*/

var resolveFn;
var getOpsos = function( phone ){
    resolveFn = resolveFn || api.def.info.detail.original;
    return resolveFn(phone).op;
};

exports = module.exports = {
    getSendedCount: function( owner, user, util ){
        db._low( 'select sum(b.progress_count) from deliveries as a, delivery_msg as b where pid=$1 and a.did=b.did;',[owner], function( err, result ){
            if( err )
                return util.error();
            else{

                return util.ok(result.rows && result.rows[0] && (result.rows[0].sum|0));
            }
        });
        return util.wait;
    },
    create: function( user, data, util ){
        /*
        Создание рассылки
        #in#
            data
                pid: hash - ID проекта
                name: text - Название рассылки
        #ok
            delivery-id
        #can user delivery.create in project: data.pid
        */
        
        db.add('list', {
                name: data.name,
                pid: data.pid,
                creator: user._id,
                createDate: new Date()
            }, function( err, result ){
                if( err ){
                    util.error(err.toString());
                }else{

                    util.ok(result.did);
                }
        });

        return util.wait;
    },
    edit: function( user, data, util ){
        /*
        Редактирование рассылки
        #in#
            data
                id: hash - id рассылки
                [name]: string - имя рассылки
        #ok
            true

         */
        var id = data.id;

        db.get( 'list', id, function( instance ){
            if( !instance )
                return util.error( 'noSuchDelivery' );

            api.access.can({
                u: user,
                instance: instance.pid,
                type: 'project',
                action: 'delivery.edit'
            }, function( result ){ if( result ){
                    delete data._id;
                    delete data.id;
                    delete data.did;

                    db.edit( 'list', id, data, function(){
                        util.ok( true );
                    } );
            }});
        });
        return util.wait;
    },
    messagecsv: function (mid, util,user,format) {

        db.get('msg', mid, function( msg ){
            if (!msg)
                return util.error('noSuchMessage');
            db.get('list', msg.did, function( delivery ) {
                if (!delivery)
                    return util.error('noSuchDelivery');
                api.access.can({
                    u: user,
                    instance: delivery.pid,
                    type: 'project',
                    action: 'delivery.createMessage'
                }, function (result) {

                    if (result) {
                        db._low(
                            'SELECT d.status, d.cid, c.phone, c.json FROM delivery_status as d ' +
                            'LEFT JOIN contacts as c ON (c.cid = d.cid::bigint) where d.mid = $1',
                            [mid], function( err,list ){
                                var smsStatusMap = {
                                    12: 'Доставлено',
                                    0: 'Добавлено в очередь',
                                    1: 'В очереди',
                                    18: 'Отказ в передаче',
                                    13: 'Просрочено',
                                    15: 'Не доставлено'
                                };

                                //console.log(delivery,msg,result);
                                util.stringify = function( data ){
                                    return data;
                                };
                                var out = list.rows.map(function (item) {
                                    var data;
                                    if(item.json){
                                        try{
                                            data = JSON.parse(item.json);
                                        }catch(e){
                                            data = {};
                                        }
                                    }else{
                                        data = {};
                                    }
                                    data.phone = item.phone||item.cid;
                                    data.status = smsStatusMap[item.status] || 'Требуется повторная экспертиза';
                                    return data;//;
                                });
                                var response = util.response;
                                response.header('Content-Type', 'text/csv; charset=utf-8');


                                var d = new Date(), filename = 'export '+ d.getFullYear()+'-'+ (d.getMonth()+1) +'-'+ d.getDate()
                                if(format==='xlsx'){
                                    var xlsx = require('node-xlsx');
                                    response.header('Content-disposition', 'attachment; filename=' + filename+'.xlsx');
                                    response.send(xlsx.build([{name: delivery.name, data: out.map(function (data) {
                                        return [data.name,data.phone,data.status]
                                    })}]));
                                }else if(format==='json'){
                                    response.header('Content-disposition', 'attachment; filename=' + filename+'.json');
                                    response.send('\uFEFF'+JSON.stringify(out,true,4));
                                }else{
                                    response.header('Content-disposition', 'attachment; filename=' + filename+'.csv');
                                    response.send('\uFEFF'+out.map(function (data) {
                                        return [data.name,data.phone,data.status].join(',');
                                    }).join('\n'));
                                }


                            }
                        );


                    }else{
                        util.error('noRights')
                    }
                });
            });
        });
        return util.wait;
    },
    list: function( user, pid, util ){

        /*
        Получить все рассылки проекта
        #in#
            pid: hash - project id
        #out
            #ok
                [{name: name, did: did, name: name}, ...]
        #can user delivery.list in project: pid
        */

        /*

         */
        db._low('SELECT * from deliveries WHERE pid = $1;'/*'SELECT DISTINCT ON (d.did)\n'+
           'd.*, m.text as last_message, m.create_date as last_date, ' +
                'm.status as last_status, ' +
                'm.failed_count as last_failed_count, ' +
                'm.delivery_count as last_delivery_count \n'+
            'FROM   deliveries d\n'+
            'LEFT   JOIN delivery_msg m ON m.did = d.did\n'+
            'WHERE  d.pid = $1\n'+
            'ORDER  BY d.did,m.create_date DESC;'*/, [pid+''], function( err, result ){
                if( err || !result.rows )
                    return util.error();

                util.ok(
                    result.rows
                        .map(
                            db._makeMapper(
                                'list',
                                {
                                    //last_date: 'timestamp',
                                    //last_message: 'text',
                                    //last_status: 'int',
                                    //last_failed_count: 'int',
                                    //last_delivery_count: 'int'
                                }
                            )
                        )
                );

            });
        /*db.getList( 'list', 'pid', pid, function( rows ){
            util.ok(rows);
        } );*/
        return util.wait;
    },
    getSendCount: function( pid, data, util, user ){
        api.project.get({id: pid}, function( instance ){
            if( instance && (instance.creator === user._id|| user._id === 'USERNAME') ){
                db._low(
                    'SELECT sum(m.progress_count) from delivery_msg as m ' +
                    'left join deliveries d on (d.did = m.did) where ' +
                        'd.pid=$1 and m.create_date between $2 and $3;',[pid, new Date(data[0]), new Date(data[1])], function( err, result ){
                    if( err || !result.rows )
                        return util.error();
                    var c = result.rows[0].sum || 0;
                    util.ok({count: c, price: c*(instance.smsPrice||110)});
                });
            }else{
                util.error('noSuchProject');
            }
        });
        return util.wait;

    },
    get: function (user, did, util) {

        db.get('list', did, function( delivery ) {

            if (!delivery)
                return util.error('noSuchDelivery');
            Z.doAfter(function (cb) {
                if(util.internal){
                    cb();
                }else{
                    api.access.can({
                        u: user,
                        instance: delivery.pid,
                        type: 'project',
                        action: 'delivery.createMessage'
                    }, function(result) {
                        if(result){
                            cb();
                        }
                    })
                }
            }, function () {
                util.ok(delivery);
            });
        });
        return util.wait;
    },
    getMessages: function( user, filter, did, util, plus, limit ){
        /*
        Получить сообщения из рассылки
        #in#
            did: hash - ID рассылки
        #out
            #ok
                [{mid: message-id, text: текст, status: текущий статус, createDate, deliveryCount, failedCount, progressCount}, ...]
        */
        limit = (limit-0) || 25;

        var data = [did,limit];
        if(filter)
            data.push((plus?'+':'')+Z.sanitize.phone(filter).raw+'');

        db._low('SELECT * from delivery_msg\n' +
        'WHERE  did = $1'+(filter? ' AND send_to = $3':'')+'\n'+
        'ORDER  BY create_date DESC\n' +
        'LIMIT $2;', data, function( err, result ){
            if( err || !result.rows )
                return util.error();
            if(!result.rows.length && (filter && !plus))
                return api.delivery.getMessages({
                    user: user, filter: filter, did: did, util: util, plus: true
                });
            else
                util.ok(
                    result.rows
                        .map( db._makeMapper('msg')));
        });
        return util.wait;
    },
    createMessage: function( user, data, text, did, to, util, planned ){
        /*
        Добавление сообщения в рассылку
        #in#

            did: hash - ID рассылки
            text: string - Текст сообщения
            [to]: string - список получателей, разделённый ;

            planned: bool - 0 = черновик, 1 = отослать
        #ok
            message-id

        */

        data = data || {};
        did = did || data.id;
        text = text || data.text;

        if(typeof text === 'number')
            text = text.toString();

        if(typeof text !== 'string')
            return util.error('invalidTypeOfText');

        if(text.trim() === '')
            return util.error('emptyText');

        if( planned === void 0 )
            planned = 1;

        db.get('list', did, function( delivery ){
            if( !delivery )
                return util.error('noSuchDelivery');
            api.access.can({
                u: user,
                instance: delivery.pid,
                type: 'project',
                action: 'delivery.createMessage'
            }, function( result ){ if( result ){
                to = to || delivery.sendTo;
                if(!to)
                    return util.error('noRecipient');

                db.add('msg', {
                    did: did,
                    createDate: new Date(),
                    creator: user._id,
                    text: text,
                    status: planned ? 1 : 0,
                    deliveryCount: 0,
                    failedCount: 0,
                    progressCount: 0,
                    sendTo: to
                }, function( err, result ){
                    var message = result;
                    if( err )
                        return util.error(err.toString());

                    var el = result;
                    api.gear.rotate({
                        iid: did,
                        type: 'delivery',
                        event: 'createMessage',
                        data: {mid: message.mid}
                    });

                    api.project.get({id: delivery.pid}, function( project ){

                        api.balance.get({owner: delivery.pid, from: delivery.pid}, function( wallet ){
                            if( !wallet )
                                return util.error('noWallet');

                            var messages = [],
                                templater = api.templater.template.detail.original,
                                templates = text.indexOf('{')>-1 && text.indexOf('}')>-1,
                                lng = smsLength(text)[0];//( msg.text, contact );;
                            var types = {};
                            api.contactList.getAssync({
                                to: to,
                                user: user,           // TODO: dehardcode
                                action: function( data ){

                                    Z.ass(data.data, function( data ){

                                        var msg = {}, i, _i, contact;

                                        for( i = 0, _i = data.length; i < _i; i++ ){
                                            contact = data[i];
                                            if( templates ){
                                                msg.text = templater( text, contact );
                                                msg.count = smsLength( msg.text )[0];
                                            }else{
                                                msg.text = text;
                                                msg.count = lng;
                                            }

                                            var op = msg.type = getOpsos(msg.phone = contact.phone);
                                            types[op] = (types[op] || 0 ) + msg.count;
                                            messages.push(msg);
                                        }

                                    }, 200, function(  ){

                                        api.costs.calculate({
                                            pid: delivery.pid,
                                            service: 'sms',
                                            data: Z.map(types, function( k, v ){
                                                return {count: v, type: k};
                                            })
                                        }, function( result ){


                                            var credit = project.credit || 0,
                                                money = wallet.amount*100;
                                            if( money + credit < result.price && !project.postPay )
                                                return util.error({text: 'notEnoughMoney', mid: message.mid});

                                            util.ok(message.mid);
                                            if( planned ){
                                                api.delivery.sendMessage({mid: message.mid, pid: delivery.pid, did: did, user: user});
                                            }
                                        })
                                    });
                                }
                            });
                        });
                    });
                    //trySend();

                });
            }else{ util.error('security')}});
        });


        return util.wait;
    },
    sendMessage: function( user, util, mid, pid, did ){
        /*
        #can user delivery.send in project: pid
        */
        var message, delivery, project, wallet, messages = [];

        db.get('msg', mid, function( result ){
            message = result;
            did = message.did;


            db.get('list', did, function( result ){
                delivery = result;
                pid = delivery.pid;
                api.project.get({id: pid}, function( result ){
                    project = result;

                    if( project && (project.creator === user._id || user._id==='USERNAME') ){
                        api.balance.get({owner: pid, from: pid}, function( result ){
                            wallet = result;
                            if( !wallet )
                                return util.error( 'noWallet' );

                            send();
                        });

                    }else{
                        return util.error('noSuchProject');
                    }
                })
            });
        });
        //}
        var send = function(  ){
            var gate = delivery.smsGate || project.smsGate || 'terasms';
            var text = message.text;
            var to = message.sendTo;
            var messages = [],
                templater = api.templater.template.detail.original,
                templates = text.indexOf('{')>-1 && text.indexOf('}' )>-1,
                lng = smsLength(text)[0];//( msg.text, contact );;
            var segments = 0;
            var sender = delivery.sender || 'billingrad';
            var types = {};
            var statusMapper = function( contact ){
                contact.id = contact.id === void 0 ? contact.phone : contact.id;

                return {
                            mid: contact.mid = mid,
                            cid: contact.cid = contact.id,
                            status: 0,
                            gate: gate
                        };
            };
            api.contactList.getAssync( {
                to: to,
                user: user,
                action: function( data ){
                    var ddata = data;
                    Z.ass( data.data, function( data ){
                        var msg, i, _i, contact;

                        for( i = 0, _i = data.length; i < _i; i++ ){

                            contact = data[i];
                            msg = {mid: mid, cid: contact.id === void 0 ? contact.phone : contact.id};
                            if( templates ){
                                msg.text = templater( text, contact );
                                msg.count = smsLength( msg.text )[0];
                            }else{
                                msg.text = text;
                                msg.count = lng;
                            }

                            var op = msg.type = getOpsos( msg.phone = contact.phone );
                            types[op] = (types[op] || 0 ) + msg.count;
                            segments += msg.count;
                            messages.push( msg );
                        }

                        var mapped = data.map(statusMapper);
                        if( mapped.length ) {
                            console.log('add new message statuses to db: ' + mapped.map(Z.getProperty('cid')));

                            db.add('status', mapped, function (err) {
                                if( err ) {
                                    console.log('ERR: after add newmsgstat', err);
                                    console.log('ERR.data: ', mapped);
                                    console.log('ERR.info: ', {
                                        to: to,
                                        gate: gate,
                                        sender: sender,
                                        text: text
                                    });
                                    console.log('ERR.assync_data: ', ddata);
                                }
                            });
                        }else{
                            console.log('ERR.empty.data: ', mapped);
                            console.log('ERR.empty.info: ', {
                                to: to,
                                gate: gate,
                                sender: sender,
                                text: text
                            });
                            console.log('ERR.empty.assync_data: ', ddata);
                        }


                    }, 200, function(){
                        db.inc('msg', mid, {progressCount: messages.length});
                        api.costs.calculate( {
                            pid: delivery.pid,
                            service: 'sms',
                            data: Z.map( types, function( k, v ){
                                return {count: v, type: k};
                            } )
                        }, function( result ){


                            var credit = project.credit || 0,
                                money = wallet.amount * 100;

                            if( money + credit < result.price && !project.postPay )
                                return util.error( {text: 'notEnoughMoney', mid: message.mid} );

                            api.costs.transaction( {
                                pid: delivery.pid,
                                service: 'sms',
                                data: Z.map( types, function( k, v ){
                                    return {count: v, type: k};
                                } )
                            }, function( result ){
                                if( result ){
                                    db.edit('msg', [mid], {status: 2});
                                    Z.ass(messages, function( list ){
                                        console.log('Delivery send messages: '+list.length);

                                        list && console.log(list.map(function(el){
                                            return el.mid+' > '+el.type+' > '+(el.phone||el.cid)+'|'+el.text;
                                        }).join('\n'));
                                        list.forEach(function (el) {
                                            api.gear.rotate({
                                                iid: did,
                                                type: 'delivery',
                                                event: 'sendMessage',
                                                data: {mid: mid, to: el.phone||el.cid}
                                            });
                                        });
                                        api.sms.justSend({
                                            gate: gate,
                                            data: list,
                                            from: sender
                                        }, function( data ){
                                            //debugger;
                                            if(data)
                                                data.forEach( function( el ){

                                                    statusChanged(el);

                                                });
                                        });

                                    }, 200, function(  ){
                                        util.ok();
                                        //tryCheck();
                                    });

                                }else{
                                    return util.error( {text: 'notEnoughMoney', mid: message.mid} );
                                }
                            });
                        } )
                    } );
                }
            } );
        };

        return util.wait;
    },
    /*
select date_trunc('minute', m.create_date) as "date", count(m.create_date) as count from delivery_status s, delivery_msg m, deliveries d
where d.pid = '4f0b8dc0d06d18f7440aa7d914061abb' and m.mid = s.mid and m.did = d.did
and m.create_date > current_timestamp - interval '14 days'
group by "date"
         */
    messageInfo: function( mid, util, user ){
        /*
        Получить информацию по отправленному сообщению
        #in#
            mid: hash - ID рассылки
        #ok
            {progressCount: 10, failedCount: 2, deliveryCount: 8}

         */
        db.get('msg', mid, function( result ){
            util.ok(result? {
                progressCount: result.progressCount,
                failedCount: result.failedCount,
                deliveryCount: result.deliveryCount
            } : false);
        });
        return util.wait;
    },
    getStat: function( user, id, util ){

        db._low('select date_trunc(\'minute\', m.create_date) as "date", count(m.create_date) as count from delivery_status s, delivery_msg m, deliveries d\n'+
            'where d.pid = $1 and m.mid = s.mid and m.did = d.did\n'+
            'and m.create_date > current_timestamp - interval \'14 days\'\n'+
            'group by "date"', [id], function( err, result ){
                if( err || !result.rows )
                    return util.error();

                util.ok( result.rows.map( function( el ){
                    return {count: el.count|0, date: +new Date(el.date)};
                }) );
        });
        return util.wait;
    },
    act: function( mid, data, util ){
        if( !util.internal )
            return false;
        var msg = mids[mid],
            gate = msg.gate,
            pid = msg.pid,
            text = msg.text;
        // here we can calculate everything.
        var messages = [],
            templater = api.templater.template.detail.original;//( msg.text, contact );;
        Z.ass(data, function( data ){
            var msg = {}, i, _i, contact;
            for( i = 0, _i = data.length; i < _i; i++ ){
                contact = data[i];
                msg.text = templater(text, contact);
                msg.count = smsLength(msg.text)[0];
                msg.type = getOpsos(contact.phone);
            }
            messages.push(msg);
        }, 200, function(  ){
            
        })

    },
    messageStat: function( mid, stat, user, util ){

        db._low(
            'SELECT d.status, d.cid, c.phone FROM delivery_status as d ' +
            'LEFT JOIN contacts as c ON (c.cid = d.cid::bigint) where d.mid = $1',
            [mid], function( err,list ){
            err && util.error(err);
            list && util.ok(list.rows)
        });


        return util.wait;
    },
    fullStatus: function (mid, user, util) {
        var smsStatusMap = {
            12: 'Delivered',
            0: 'Pending',
            1: 'Sending',
            18: 'NotSent',
            13: 'TimedOut',
            15: 'NotDelivered'
        };

        db._low(
            'SELECT m.create_date, m.send_date, m.finish_date, m.text, d.status, d.cid, c.phone, c.json FROM delivery_status as d ' +
            'LEFT JOIN contacts as c ON (c.cid = d.cid::bigint) ' +
            'LEFT JOIN delivery_msg as m ON (m.mid = d.mid)'+
            'where d.mid = $1',
            [mid], function( err,list ){
            err && util.error(err);
            list && util.ok(list.rows.map(function (el) {
                var data;
                if(el.json){
                    try{
                        data = JSON.parse(el.json);
                    }catch(e){
                        data = {};
                    }
                }else{
                    data = {};
                }
                var messages = [],
                    templater = api.templater.template.detail.original,
                    templates = el.text.indexOf('{')>-1 && el.text.indexOf('}')>-1,
                    lng = smsLength(templates ?templater( el.text, data ):el.text)[0];

                return {
                    status: smsStatusMap[el.status] || smsStatusMap[15],
                    cid: !el.phone ? null : el.cid,
                    phone: el.phone || el.cid,
                    mid: mid,
                    segments: lng,
                    date: el.create_date ? (new Date(el.create_date)).toISOString() : '',
                    deliveryDate: el.finish_date ? (new Date(el.finish_date)).toISOString() : '',
                    sendDate: el.send_date ? (new Date(el.send_date)).toISOString() : ''
                }
            }));
        });

        return util.wait;
    },
    status: function( mid, user, util ){
        /*
        Получить информацию по отправленному сообщению
        #in#
            mid: hash - ID сообщения
            did: hash - ID рассылки
        #ok
            [{status: status, cid: contact id || null, phone: phone}]

         */


        var smsStatusMap = {
            12: 'delivered',
            0: 'in queue',
            1: 'in queue',
            18: 'rejected',
            13: 'timeout',
            15: 'failed'
        };

        db._low(
            'SELECT d.status, d.cid, c.phone FROM delivery_status as d ' +
            'LEFT JOIN contacts as c ON (c.cid = d.cid::bigint) where d.mid = $1',
            [mid], function( err,list ){
            err && util.error(err);
            list && util.ok(list.rows.map(function (el) {
                return {
                    status: smsStatusMap[el.status] || smsStatusMap[15],
                    cid: !el.phone ? null : el.cid,
                    phone: el.phone || el.cid
                }
            }));
        });

        return util.wait;
    }
};

    var accumulatorTimeout = function(){
        clearTimeout( this.timeout );
        var packs = {},
            gate = this.gate;

        var progress = {};
        this.msgs.forEach( function( el ){
            progress[el.mid] = ( progress[el.mid] || 0 ) + 1;
            (packs[el.sender] = packs[el.sender] || []).push({phone: el.to, text: el.text, mid: el.mid, cid: el.cid});
        } );

        for( var i in progress )
            if( progress.hasOwnProperty(i)){
                setImmediate( function( i ){
                    App.log([mids[i],progress[i]]);
                    //console.log( 'IO '+ mids[i].pid + ' mid:'+i+', progres: '+progress[i]);
                    api.notify.project({
                        pid: mids[i].pid,
                        type: 'delivery',
                        data: {mid: i, progress: progress[i]}
                    });

                    db.inc('msg', i, {progressCount: progress[i]});
                }.bind(this, i));
            }

        Z.each(packs, function( sender, el ){
            setImmediate( function(  ){
                api.sms.justSend({
                    gate: gate,
                    data: el,
                    from: sender
                }, function( data ){
                    data.forEach( function( el ){
                        statusChanged(el);
                    });
                    
                });
            });
        });

    };
var accumulators = {};
var mids = {};
var ioStatusChanged = function( el, data ){
    var pid = el.pid;
    if( !pid )
        pid = mids[el.mid] && mids[el.mid].pid;
    //console.log( 'IO pid'+ pid);
    if( pid ){
        //console.log( 'IO '+ pid + ' '+ JSON.stringify(data));
        api.notify.project({
            pid: pid,
            type: 'delivery',
            data: data
        });

    }
};
var statusChanged = function( el ){
    db.get('status', [el.mid, el.cid], function( item ){
        if( item.status !== el.status || item.gateId !== el.gateId ){
            el.status >10 && console.logModule('infobip','status changed ', item.status , el.status , item.gateId , el.gateId)
            db.edit('status', [el.mid, el.cid], {
                status: el.status,
                gateId: el.gateId
            });

            if( el.status === 12 ){
                ioStatusChanged(el,{mid: el.mid, delivery: 1});
                db.edit('msg', el.msg, {finishDate: +new Date()});
                db.inc('msg', el.mid, {deliveryCount: 1});

            }else if( el.status > 10 || el.status < -10 ){
                ioStatusChanged(el,{mid: el.mid, fail: 1});
                db.edit('msg', el.msg, {finishDate: +new Date()});
                db.inc('msg', el.mid, {failedCount: 1});
            }
            api.gear.rotate({
                iid: el.mid,
                type: 'message',
                event: 'changeStatus',
                data: {status: el.status}
            });
        }
    });


};
var checkInterval = 15000;
var tryCheck = function(  ){
    App.action('tryCheck', checkInterval, function(err, data){
        //App.log( 'tryCheck' );
        //App.io.to('9200c4b692fec3d7b6c417db9f05dedc' ).emit('delivery',{mid:32,fail:1});
        db.getList( 'status', 'status', [0, 1], function( rows ){

            rows = rows.filter( function( el ){
                return el.gateId;
            } );
            //console.red(rows.length);
            var gates = {}, i, _i, row, gate, c = 0;

            if( rows.length > 5000 ){
                var tmpRows = [], cc = 0;
                while(cc<5000){
                    tmpRows.push(rows.splice(Math.floor(Math.random()*rows.length),1)[0]);
                    cc++;
                }
                rows = tmpRows;
            }

            for( i = 0, _i = rows.length; i < _i; i++ ){
                row = rows[i];
                if( !( gate = gates[row.gate] ) )
                    gates[row.gate] = [row];
                else
                    gate.push( row );
            }

            if( rows.length ) {
                Z.each(gates, function (gate, rows) {
                    //console.log(rows)
                    console.logModule('status','status check', gate, rows.length);
                    c++;
                    setImmediate(function () {
                        var hash = Z.makeHash(rows, 'gateId');
                        api.sms.justCheck({gate: gate, ids: rows.map(Z.getProperty('gateId'))}, function (data) {

                            var i, row;
                            for (i in data) {
                                if (data.hasOwnProperty(i)) {
                                    row = hash[i];
                                    //gate === 'infobip' && console.logModule('status', row,i,data[i]);
                                    if (data[i] !== 0) {
                                        row.status = data[i];
                                        //App.log( row );
                                        statusChanged(row);
                                    }
                                }
                            }

                            c--;
                            //c === 0 &&
                        }, false, 666);
                    });

                });
                setTimeout( tryCheck, checkInterval * 2 );
            }else
                setTimeout( tryCheck, checkInterval );
        } );
    }, function(){
        setTimeout( tryCheck, checkInterval );
    });
};

var trySend = function(){

    App.log('trySend');
    db.getList( 'msg', 'status', 1, function( rows ){
        if(rows.length > 100 )
            setTimeout(trySend, 4000);

        rows = rows.slice(0,100);
        // get 0-100 new smses that are ready to be send

        var deliveries = {};
        rows.forEach( function( el ){
            deliveries[el.did] = true;
        });
        if( rows.length === 0 )
            return;
        //console.log('update status',[rows.map( Z.getProperty('mid') )]);
        db.edit('msg', [rows.map( Z.getProperty('mid') )], {status: 2});
        var c = 0;
        // here we are getting "send to" for each message (each delivery is querying once).
        Z.doAfter( function( callback ){
            Z.each(deliveries, function( id ){
                c++;
                db.get('list', id, function( instance ){
                    deliveries[id] = instance;
                    c--;
                    if( c === 0)
                        callback();
                })
            });
        }, function(){
            rows.forEach( function( el ){
                var instance = deliveries[el.did],
                    to = instance.sendTo;
                api.project.get({id: instance.pid}, function( project ){
                    api.balance.get({owner: instance.pid, from: instance.pid}, function( wallet ){
                        //console.log('wallet is');
                        if( !wallet ){
                            return App.io.to( instance.pid ).emit('error', 'noWallet');
                        }
                        mids[el.mid] = {
                            mid: el.mid,
                            gate: project.gate || 'terasms',
                            pid: instance.pid,
                            sender: instance.sender || 'billingrad',
                            text: el.text,
                            wallet: {
                                id: wallet.id,
                                amount: wallet.amount,
                                price: project.smsPrice
                            }
                        };
//                        console.log('getAssync', to);
                        api.contactList.getAssync({
                            to: el.sendTo,
                            user: {_id: el.creator},           // TODO: dehardcode
                            action: {'delivery.act': {
                                mid: el.mid
                            }}
                        });
                    });
                });
            });
        });
    } );
};

//setTimeout(trySend,4000checkInterval);
setTimeout(tryCheck,checkInterval);
})();
/*
update delivery_status set status=15 where status in (0,1) and mid in(select s.mid from delivery_status as s left join delivery_msg as m on(m.mid = s.mid and m.create_date<'2015-07-20') where s.status in (0,1));
 */