/**
 * Created by Ivan on 6/22/2015.
 */
var db = Z.pg.use('gears'),
    moment = require('moment');

var cosher = require('z-redis-cosher'),
    reducers = new cosher({
        name: 'gear',
        idKey: 'id',
        timeout: 60*24,
        connectCfg: App.cfg.redis,
        query: function (id, cb) {
            db.get('lastReduce', {rid:id}, function (res) {
                if(!res)
                    return cb(null);
                cb(res);
            });
        }
    });

var idGears = [];
var soapFailXML = function (code, description) {
    return {
        status: 500,
        headers: {'Content-Type': 'text/xml'},
        error: true,
        tpl: [
            '<?xml version="1.0" encoding="utf-8"?>',
            '<soap:Envelope xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance" xmlns:xsd="http://www.w3.org/2001/XMLSchema" xmlns:soap="http://schemas.xmlsoap.org/soap/envelope/">',
            '    <soap:Body>',
            '        <soap:Fault>',
            '            <faultcode>'+ code +'</faultcode>',
            '            <faultstring>'+ description +'</faultstring>',
            '            <faultactor>sms</faultactor>',
            '            <detail>',
            '                <code>'+ code +'</code>',
            '                <description>'+ description +'</description>',
            '            </detail>',
            '        </soap:Fault>',
            '    </soap:Body>',
            '</soap:Envelope>'].join('\n')
    };
};
var Event = function (item) {
    this.data = item.data;
    this.date = +item.date;
};
Event.prototype = {data:null, date:null};
//var sequences = {};
var getReduceSequence = function (gear, item, cb, cropCb) {
    var now = new Date();
    var reducer = gear.reduce,
        group = reducer.group,
        eventName = [gear.id];

    var q = {
        type: gear.type,
        event: gear.event,
        iid: gear.iid
    };
    if( group ){
        q[group] = item[ group ];
    }

    q.type && eventName.push(q.type);
    q.event && eventName.push(q.event);
    q.iid && eventName.push(q.iid);
    eventName = eventName.join('.');
    //console.log('EVT NAME', q, eventName);
    reducers.get(eventName, function (err, res) {
        var firstReduce = false;
        //console.log(res);
        Z.doAfter(function (cb) {
            //console.log('IF1', !res);
            //debugger;
            if (!res) {
                db.add('lastReduce', {rid: eventName,eid: 0,date: item.date}, function (err) {
                    res = reducers.hash[eventName] = {
                        rid: eventName,
                        eid: 0,
                        date: item.date,
                        len: 1
                    };
                    firstReduce = true;
                    reducers.change(eventName);
                    //console.log('ADD to redis', res);
                    cb();
                });

            } else {
                res.date = new Date(res.date);
                res.len++;
                cb();
            }
        }, function () {
            //console.log('#', err, res);
            /*console.log('IF2', {
                firstReduce: firstReduce,
                count: reducer.count && res.len>=reducer.count,
                duration: [reducer.duration,new Date(res.date),new Date(+moment(item.date).subtract(reducer.duration))]
            });
            console.log({
                res: res.date,
                item: item.date
            });*/
            var lowDate = +moment(res.date).subtract(reducer.duration),
                crop = {};

            //debugger;

            var query = [],
                vals = [], x = 0;

            if(q.type) {
                x++;
                query.push('type=$' + x);
                crop.type = q.type;
                vals.push(q.type);
            }
            if(q.event) {
                x++;
                query.push('event=$' + x);
                crop.event = q.event;
                vals.push(q.event);
            }
            if(q.iid) {
                x++;
                query.push('iid=$' + x);
                crop.iid = q.iid;
                vals.push(q.iid);
            }
            if(res && res.eid !== void 0) {
                x++;
                query.push('eid>=$' + x);
                crop.eid = q.eid;
                vals.push(res.eid);
            }
            if(!(firstReduce ||
                (reducer.count && res.len>=reducer.count) || // reducer options check
                (reducer.duration && (+item.date) >= // check
                    lowDate)
            )){
                reducers.hash[eventName] = res;
                console.log('update redis', eventName, res);
                reducers.change(eventName);
                crop.none = true;
                cropCb(crop);
                return;
            }
            var qu = 'SELECT * from event where '+query.join(' and ')+' order by eid asc;';
            console.log(qu, vals);
            db._low(qu, vals, function (err, result) {
                var i, _i, c, seq, end;
                if(err)
                    return;
                seq = result.rows
                    .map( db._makeMapper('event') );

                //console.log('IF count ', reducer.count, seq.length, c);
                var subSeq, lastSeq, d;
                if( (c = reducer.count) && seq.length >= c ) {
                    for (i = 0, _i = ((seq.length / c) | 0) * c; i < _i; ) {
                        end = i + c;
                        if(end>_i)
                            break;
                        lastSeq = [i, end];
                        subSeq = seq.slice(i, end);
                        cb(subSeq);
                        if(reducer.cursor !== void 0){
                            if(reducer.cursor >= 0) {
                                i += reducer.cursor;
                            } else {
                                i += subSeq.length + reducer.cursor; // check
                            }
                            //console.log('LAST seq el', seq[end]);
                        }else{
                            i += c
                        }
                    }
                }else if(d = reducer.duration) {
                    //console.log(seq);
                    subSeq = [];
                    var nextPos = moment(res.date || seq[0].date).add(d), item;
                    //console.log(nextPos, seq.length);
                    for(i=0,_i=seq.length;i<_i;i++){
                        item = seq[i];
                        if(+item.date > +nextPos){
                            nextPos = nextPos.add(d);
                            subSeq.length && (cb(subSeq));
                            subSeq.length && console.log('trig', subSeq.length, subSeq[0].date, subSeq[subSeq.length-1].date)
                            lastSeq = subSeq;
                            end = i+1;
                            subSeq = [];
                        }
                        subSeq.push(item)

                    }
                }else if(seq.length){
                    res.len = seq.length;
                    reducers.hash[eventName] = res;
                    //console.log('NOT enough update', eventName, res);
                    reducers.change(eventName);
                }
                if(end !== void 0){
                    end--;
                    if(reducer.cursor !== void 0){
                        if(reducer.cursor >= 0) {

                            end = lastSeq[0]+reducer.cursor;
                        } else {
                            end = lastSeq[1] - (-reducer.cursor);
                        }
                        //console.log('LAST seq el', seq[end]);
                    }

                    //console.log('before error', seq, end);

                    var o = {
                        eid: seq[end].eid,
                        date: seq[end].date
                    };
                    console.log('TO', o);
                    db.edit('lastReduce', eventName, o, function () {
                        o.len = seq.length - end;
                        reducers.hash[eventName] = o;
                        reducers.change(eventName);

                        if(end>0) {

                            // TODO not end, but max needed part of seq
                            //var usedSeq = seq.slice(0, end),
                            //    vals = [], c = 0;
                            crop.eid = seq[end].eid;
                            cropCb(crop);
                            /*db._low('DELETE from event where eid in ('+
                                usedSeq.map(function (el) {
                                    c++;
                                    vals.push(el.eid);
                                    return '$'+c
                                }).join(',')+');',
                                vals,
                                function () {}
                            );
                            db.add('eventTrash', usedSeq, function () {});
*/
                        }else{
                            crop.none = true;
                            cropCb(crop);
                        }
                    });
                }else{
                    res.eid && (crop.eid = res.eid - 1);
                    crop.none = true;
                    cropCb(crop);
                }
            });
        });
    });

};
var h = 13;
var nxt = function () {

    api.gear.rotate({
        iid: '22',
        type: 'delivery',
        event: 'createMessage',
        data: {mid: Math.random()}
    });
            /*h-=0.8;
            api.gear.rotate({
                iid: 'MAINPROJ',
                type: 'project',
                event: 'balanceChange',
                data: h
            });*/
setTimeout(nxt,(Math.random()*1000)|0);
}
//setTimeout(nxt,3000);


/*var setReduceSequence = function (item) {
    var evtName = item.type+'.'+item.event,
        group = sequences[evtName] || (sequences[evtName] = {}),
        list = group[item.iid] || (group[item.iid] = []);
    list.push(new Event(item))
};*/

/*var cosher = require('z-redis-cosher');
var m = new cosher({
    name: 'gear',
    idKey: 'id',
    timeout: 60 * 24,
    connectCfg: App.cfg.redis,
    /!*query: function( pid, cb ){
        cb([]);
    },*!/
    onchange: function (k, v) {
        console.log('##', k, v, this.hash[k].length, this.unique);
    }
}),
    j = 0,
    h = function () {
        setTimeout(h, Math.random()*1000);
        m.push('k0', j++);
    };*/
//h();
var gears = [
    {
        id: 'bch',
        type: 'project',
        event: 'balanceChange',
        reduce: {
            group: 'iid',
            count: 2,
            as: 'result',
            args: {
                seq: '{{result}}',
                val: 10
            },
            action: 'math.getLower',
            cursor: 1,
            after: {
                filter: {
                    result: {$eq: true}
                },
                after: {
                    action: 'log.write',
                    args: {data: 'get low'}
                }
            }
        }
    },
    /*{
        id: 'some_time',
        type: 'delivery',
        event: 'createMessage',

        reduce: {
            group: 'iid',
            duration: {seconds: 10},
            action: 'reduce.counter',
            as: 'result',
            args: {
                seq: '{{result}}'
            },
            after: {
                action: 'log.write',
                args: {data: '{{result}}'}
            }
        }
    },
    {
        id: 'some_time2',
        type: 'delivery',
        event: 'createMessage',

        reduce: {
            group: 'iid',
            duration: {seconds: 20},
            action: 'reduce.counter',
            as: 'result',
            args: {
                seq: '{{result}}'
            },
            after: {
                action: 'log.write',
                args: {data: '{{result}}'}
            }
        }
    },*/
    /*{
        id: 'some_time3',
        type: 'delivery',
        event: 'createMessage',
        reduce: {
            group: 'iid',
            count: 55,
            action: 'reduce.counter',
            as: 'result',
            args: {
                seq: '{{result}}'
            },
            after: {
                action: 'log.write',
                args: {data: '{{result}}'}
            }
        }
    },
    {
        id: 'msgInDeliv',
        type: 'delivery',
        event: 'createMessage',
        reduce: {
            group: 'iid',
            duration: {seconds: 20},
            action: 'statistic.collect',
            as: 'result',
            args: {
                seq: '{{result}}',
                iid: '{{iid}}',
                type: '{{event}}',
                data: 'mid'
            },
            after: {
                action: 'log.write',
                args: {data: '{{result}}'}
            }
        }
    },*/
{
    id: 'wrap',
    type: 'project',
    iid: '863f692f9ce5a49ac14232aaf1062b33',
    event: 'push',

    after: {
        action: 'parse.xml',
        args: {text: '{{_body}}'},
        as: 'body',
        after: {
            filter: {
                body: {
                    'soap:Envelope': {
                        'soap:Body': {
                            '0': {
                                GetMessageStatus: {$exists: true}
                            }
                        }
                    }
                }
            },
            after: {
                filter: {
                    project: {
                        vars: {
                            login: {$eq: '{{body.soap:Envelope.soap:Body.0.GetMessageStatus.0.login.0}}'},
                            password: {$eq: '{{body.soap:Envelope.soap:Body.0.GetMessageStatus.0.password.0}}'}
                        }
                    }
                },
                after: {
                    action: 'authorize.byKeys',
                    args: {open: '10jjh1mgybrdcoeczmxhe', close: 'r1azvsocqk8xeu7pq2w24o49ptz32z6e73tcis3p7b'},
                    as: 'user',
                    after: {
                        action: 'delivery.fullStatus',
                        args: {
                            user: '{{user}}',
                            mid: '{{body.soap:Envelope.soap:Body.0.GetMessageStatus.0.messageID.0}}'
                        },
                        as: 'minfo',
                        answer: {
                            headers: {'Content-Type': 'text/xml'},
                            tpl: [
                                '<?xml version="1.0" encoding="utf-8"?>',
                                '<soap:Envelope xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance" xmlns:xsd="http://www.w3.org/2001/XMLSchema" xmlns:soap="http://schemas.xmlsoap.org/soap/envelope/">',
                                '    <soap:Body>',
                                '         <GetMessageStatusResponse xmlns="http://mcommunicator.ru/M2M">',
                                '            <GetMessageStatusResult>',
                                '                <DeliveryInfo>',
                                '                    <Msid>{{minfo.0.phone}}</Msid>',
                                '                    <DeliveryStatus>{{minfo.0.status}}</DeliveryStatus>',
                                '                    <DeliveryDate>{{minfo.0.date}}</DeliveryDate>',
                                '                    <UserDeliveryDate>{{minfo.0.deliveryDate}}</UserDeliveryDate>',
                                '                    <PartCount>{{minfo.0.segments}}</PartCount>',
                                '                </DeliveryInfo>',
                                '            </GetMessageStatusResult>',
                                '        </GetMessageStatusResponse>',
                                '    </soap:Body>',
                                '</soap:Envelope>'
                            ].join('\n'),
                            error: false
                        },
                        else: {
                            answer: soapFailXML(666, 'wrong message id')
                        }
                    },
                    else: {
                        answer: soapFailXML(777, 'bad keys')
                    }
                },
                'else' : {
                    answer: soapFailXML(503, 'access denied')
                }
            },
            else: {
                filter: {
                    project: {
                        vars: {
                            login: {$eq: '{{body.soap:Envelope.soap:Body.0.SendMessage.0.login.0}}'},
                            password: {$eq: '{{body.soap:Envelope.soap:Body.0.SendMessage.0.password.0}}'}
                        }
                    }
                },
                after: {
                    action: 'authorize.byKeys',
                    args: {open: '10jjh1mgybrdcoeczmxhe', close: 'r1azvsocqk8xeu7pq2w24o49ptz32z6e73tcis3p7b'},
                    as: 'user',
                    after: {
                        action: 'delivery.createMessage',
                        args: {
                            user: '{{user}}',
                            did: '153',
                            text: '{{body.soap:Envelope.soap:Body.0.SendMessage.0.message.0}}',
                            to: '{{body.soap:Envelope.soap:Body.0.SendMessage.0.msid.0}}'
                        },
                        as: 'mid',
                        else: {
                            answer: soapFailXML(300, 'create message fail')
                        },
                        answer: {
                            headers: {'Content-Type': 'text/xml'},
                            tpl: [
                                '<?xml version="1.0" encoding="utf-8"?>',
                                '<soap:Envelope xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance" xmlns:xsd="http://www.w3.org/2001/XMLSchema" xmlns:soap="http://schemas.xmlsoap.org/soap/envelope/">',
                                '  <soap:Body>',
                                '    <SendMessageResponse xmlns="http://mcommunicator.ru/M2M">',
                                '      <SendMessageResult>{{mid}}</SendMessageResult>',
                                '    </SendMessageResponse>',
                                '  </soap:Body>',
                                '</soap:Envelope>'
                            ].join('\n'),
                            error: false
                        }
                    },
                    else: {
                        answer: soapFailXML(777, 'bad keys')
                    }
                },
                'else' : {
                    answer: soapFailXML(503, 'access denied')
                }
            }

        },
        'else': {
            answer: soapFailXML(13, 'xml parsing error')
        }
    }
}
/*{
    type: 'project',
    iid: 'ololo',
    event: 'recieve',
    filter: Z.selector({'{{type}}': 'humidity', '{{humidity}}': {$lt: 10}}),
    after: {
        user: 'USERNAME',
        action: 'math.random',
        args: {from: 0, to: 'humidity'},
        as: 'count',
        after: {
            'do': 'base.repeat',
            args: {
                count: 'count',
                act: 'log',
                args: {text: 'humidity'}
            }
        }
    }

}, {
    type: 'project',
    action: 'log'
}, {
    action: 'log'
}, */
/*{
    type: 'project',
    iid: 'f25680a1c32fd9a4867c28dcaa0002e3',
    event: 'push',
    after: {
        action: 'delivery.createMessage',
        args: {
            user: {id: 'USERNAME', _id: 'USERNAME'},
            did: '38',
            text: 'fuck',
            to: '79164819441'
        },
        as: 'mid',
        else: {
            answer: {error: true, data: 'create message fail'}
        },
        answer: {
            tpl: [
                '<?xml version="1.0" encoding="utf-8"?>',
                '<soap:Envelope xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance" xmlns:xsd="http://www.w3.org/2001/XMLSchema" xmlns:soap="http://schemas.xmlsoap.org/soap/envelope/">',
                '  <soap:Body>',
                '    <SendMessageResponse xmlns="http://mcommunicator.ru/M2M">',
                '      <SendMessageResult>{{mid}}</SendMessageResult>',
                '    </SendMessageResponse>',
                '  </soap:Body>',
                '</soap:Envelope>'
            ].join('\n'),
            error: false
        }
    }},*/
];
/*setTimeout(function () {
    api.reinit('gear');
}, 5000);*/
var tpl = require(App.base+'/js/tpl');

var getVar = function (scope, name) {
    if(typeof name != 'object') {
        name += '';
        //console.log('get var', name);
        if (name.indexOf('{{') === 0) {
            var data;
            name.replace(/{{([^{]*?)}}/g, function (full, expr) {
                data = expr.split('.').reduce(function (obj, token) {
                    //////console.log(obj, token);
                    return obj && obj[token];
                }, scope);
                //console.log('resolve', name, data);
            });
            return data;
        } else {
            return name;
        }
    }else{
        return name;
    }

};

var setVar = function (scope, name, val) {
    var tokens = name.split('.'), token, i, _i, oldVal;
    for(i = 0, _i = tokens.length - 1; i <= _i; i++){
        token = tokens[i];
        if(i < _i)
            scope[token] = scope[token] || {};
        else {
            oldVal = scope[token];
            scope[token] = val;
        }
    }
    return scope;
};
var getter = {
    'project': function (pid, callback) {
        api.project.get({id: pid}, function (obj) {
            callback(obj);
        });
    },
    'var': function (scope) {

    },
    'delivery': function (did, callback) {
        api.delivery.get({did: did}, function (obj) {
            callback(obj);
        });
    }
};
var mapFilter = function (scope, obj) { // scope as first var can be used for bind.
    var out = {};
    if (typeof obj === 'object') {
        Z.each(obj, function (k, v) {
            out[getVar(scope, k)] = mapFilter(scope, v);
        });
    }else {
        out = getVar(scope, obj);
    }
    return out;
};
var todo = function (action, scope, util) {
    /*if(action.user) {
        api.authorize.getUserById(action.user, function (user) {
            api.rotate.addInternal({
                u: user,
                scope: scope
            });
        });
    }else */
    var error = false,
        token, filter, frame, mapped;
    Z.doAfter(function (callback) {
        if(action.filter){
            mapped = mapFilter(scope, action.filter);
            //////console.log(scope);
            //////console.log('mapped',mapped);
            filter = Z.selector(mapped);
            //console.log('filtering', JSON.stringify(mapped,null,2), filter.toString(), filter(scope));
            error = error || !filter(scope);
            callback();
        }else{
            callback();
        }
    }, function (callback) {
        if(!error && action.action){
            token = action.action.split('.');
            // TODO simultaneously queries
            /*if( action.action === 'delivery.createMessage')
                debugger;*/
            if(action.args){
                Z.each(action.args, function (k, v) {
                    scope[getVar(scope, k)] = getVar(scope,v);
                    //scope[k] = getVar(scope, v);
                });
            }
            //console.log('action', token, scope);
            frame = {name: token, data: Z.clone(scope)};
            scope._callStack.push(frame);
            api.gear.query({fns:[{
                m: token[0],
                f: token[1],
                d: scope
            }]}, function (res) {

                var r = res[0];
                frame.reply = r;

                if(!r)
                    return util.error(false);

                if(action.as)
                    setVar(scope, action.as, r.data);
                error = error || r.error;
                callback();
            });
        }else{
            callback();
        }
    }, function () {
        if(error){
            if(action['else']){
                return todo(action['else'], scope, util);
            }else{
                return util.error('please specify else case');
            }
        }else{
            if( action.answer ){
                var answer = action.answer;
                //console.log('answer', answer);
                if(answer.status){
                    util.setStatus(500);
                }
                if(answer.headers){
                    util.addHeader(answer.headers);
                }
                if( answer.tpl ){


                    try {
                        var out = tpl.getJSF(answer.tpl).f(scope);
                        util.stringify = function( data ){
                            return data.data;
                        };
                        return util.ok(out);
                    }catch(e){
                        if(action['else']){
                            return todo(action['else'], scope, util);
                        }else{
                            return util.error('Error in template `'+answer.tpl+'`')
                        }

                    }

                } else {
                    return util[answer.error ? 'error' : 'ok'](answer.data);
                }
            }
            if(action.after){
                todo(action.after, scope, util);
            }else{
                return util.ok('success');//r.data);
            }
        }
    });


};
var tryCrop = function (seqs) {

    var seq,
        vals = [],
        where = [],
        c = 0,
        eid, i, _i, allNone = true;
    for( i = 0, _i = seqs.length; i < _i; i++) {
        seq = seqs[i];
        if(seq.none)
            delete seq.none;
        else
            allNone = false;
        if (seq.eid && (!eid || seq.eid < eid))
            eid = seq.eid;
    }
    if(allNone) // nothing to crop
        return;
    if(eid){
        ++c;
        where.push('"eid"<$'+c);
        vals.push(eid);
    }
    for(i in seq){
        if(i !== 'eid'){
            ++c;
            where.push('"'+i+'"=$'+c);
            vals.push(seq[i])
        }
    }
    console.log('CRoP', JSON.stringify(seqs), where, vals);

    /*
    eid in ('+
        usedSeq.map(function (el) {
            c++;
            vals.push(el.eid);
            return '$'+c
        }).join(',')+');',*/
    db._low('SELECT * from event where '+where.join(' AND ') +';',
        vals,
        function (err, res) {
            if(!err && res && res.rows && res.rows.length){
                var c = 0, vals = [];
                console.log('TRASHING', res.rows.map(Z.getProperty('eid')));
                db.add('eventTrash', res.rows, function () {});
                db._low('DELETE from event where eid in ('+
                    res.rows.map(function (el) {
                        c++;
                        vals.push(el.eid);
                        return '$'+c;
                    }).join(',') +');',
                    vals,
                    function (){}
                );
            }else{
                //debugger;
                //console.log('Error selecting events',seqs, seq);
            }
        }
    );
};

exports = module.exports = {
    rotate: function (iid, type, event, data, _body, user, util) {
        var d = new Date(),
            evt = {
                iid: iid,
                type: type,
                event: event,
                data: data,
                date: d
            };

        db.add('event', evt, function () {
            //setReduceSequence(evt);
            //R.setex( 'gear.'+ evtName, JSON.stringify( {d: data, t: +d} ), function(){} );

            var items = [], el;

            // TODO: unsomeshit
            for( var i = 0, _i = gears.length; i < _i; i++ ){
                el = gears[i];
                (
                    (!('iid' in el) || el.iid === iid) &&
                    (!('type' in el) || el.type === type) &&
                    (!('event' in el) || el.event === event) &&
                    (!('filter' in el) || el.filter(data))
                ) && items.push(el);
            }
            if( items.length ){

                getter[type](iid, function (scope) {
                    if( scope ){
                        //console.log('evt',evt);
                        var S = function(){};
                        //console.log(data)
                        if(typeof data !== 'object')
                            S.prototype = {value: data};
                        else
                            S.prototype = data ? Object.create(data) : {};
                        S.prototype[type] = scope;
                        Z.apply(S.prototype, {
                            _body: _body,
                            _callStack: []
                        });
                        var crops = items.filter(function (el) {
                            return el.reduce;
                        }).length, cropsLength = crops, cropSeqs = [];
                        items.forEach(function (item) {
                            var after,
                                reduce;
                            //console.log(item);
                            if(reduce = item.reduce){
                                after = reduce.after;
                                getReduceSequence(item, evt, function (seq) {
                                    var scope = new S();
                                    Z.apply(scope,{iid: iid, event: event, type: type});
                                    //debugger;
                                    if(reduce.after) {
                                        setVar(scope, reduce.as || 'data', seq);
                                        reduce.after && todo(reduce, scope, util);
                                        if (seq.length === 1)debugger;
                                        console.log('SEQ', reduce.duration || reduce.count, seq.length, JSON.stringify(seq.map(Z.getProperty('eid'))));
                                    }
                                    //console.log(after,scope,seq,reduce.as);
                                },
                                    function (seq) { // cropping
                                        crops--;
                                        if(seq===void 0)
                                            return;
                                        cropSeqs.push(seq);
                                        if(crops === 0)tryCrop(cropSeqs);
                                    });
                                //console.log(11);
                            }else if(after = item.after) {
                                todo(after, new S(), util);
                            }
                        });
                        cropsLength && !crops && tryCrop(cropSeqs);
                    }
                });
            }
        });
        //console.log('gear:timing', +new Date()-(+d), items.length);
        return util.wait;
    },
    addInternal: function (util, user) {
        if(!util.internal)
            return util.error(false);

        var uid = 'ev_'+ Z.UUID.getRandom();
        return util.ok(uid);
    },
    query: function (fns, util) {
        var user = util.user;
        var count = fns.length,
            answer = [],
            after = function () {
                count--;
                if(!count)
                    util.ok(answer);
            };


        /*console.log(App.realUser(util.user));
        console.log('gear.query %%',util.user,
            util.user.realUser,util.user.realUser && util.user.realUser.id,
            '$$',App.realUser(util.user),
            '$$');
        console.log('checks', util.user.realUser instanceof App.realUser)
        console.log('accumulated query', fns.map(function (el) {
            return el.m +'.'+ el.f;
        }).join(', '));*/
        fns.forEach(function (el, i) {
            var l;
            if(!(l = api[el.m])){
                answer[i] = {error: true, data: 'No such module'};
                return after();
            }
            var fn = l[el.f];
            if(!fn){
                answer[i] = {error: true, data: 'No such function in a module'};
                return after();
            }
            if(!el.d)el.d = {};
            el.d.user = user || el.d.user;

            el.d.util = new App.response({
                req: util.internal?{}:util.response.req,
                send: function (data) {
                    var firstCall = !answer.hasOwnProperty(i);
                    answer[i] = data;
                    firstCall && after();
                }
            });
            el.d.util.stringify = function (a) {
                return a;
            };
            if(!fn.detail.needUser || el.d.user){
                //setImmediate(function () {
                //console.log(el.m,el.f,'%%',el.d.user, '$$',App.realUser(el.d.user),'$$');
                    fn.call(l, el.d);
                //});
            }else {
                answer[i] = {error: true, data: 'Security'};
                return after();
            }
        });
        return util.wait;
    }
};
//setTimeout()
