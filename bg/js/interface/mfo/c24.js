/**
 * Created by Ivan on 6/15/2015.
 */
var providers = {
    card: '1200'
};
var errorCodes = {
    220: 50,
    241: 21,
    243: 21,
    247: 21,
    242: 22,
    244: 22,
    149: 30,
    150: 30,
    71: 30,
    300: 40,
    4: 23,
    2: 31,
    5: 32
};
var statusCodes = {
    90: 10,
    180: 30
};
var otherCodes = {
};
var i;
for(i=0; i< 90;i++)
    otherCodes[i] = 0;
for(i=91; i< 100;i++)
    otherCodes[i] = 100;
for(i=100; i< 256;i++)
    otherCodes[i] = 20;
var getStatus = function (err, status) {
    return err ? (errorCodes[err]?errorCodes[err]: otherCodes[err]) :
        (statusCodes[status]?statusCodes[status]: otherCodes[status]);
};
/*
1. 0...89 — ?????? ??????, ? ???????? ??????????
2. 90 — ?????? ???????? ???????
3. 91..99 — ?? ????????????.
4. >=100 — ?????? ???????? ? ??? ??? ???? ???????.*/



exports = module.exports = (function(){ 'use strict';
    var fs = require( 'fs' ),
        tpl = require(App.base+'/js/tpl'),
        curl = require('tinycurl');
    var xmlParser = require('xml2js');

    tpl.loadAll(App.base + '/js/interface/mfo/c24');
    var parseXML = function (data, cb) {
        if(!data)
            return cb(false);
        try {
            xmlParser.parseString(data, function (err, data) {
                if(err){
                    return cb(false);
                }
                cb(data);
            });
        }catch(e){
            return cb(false);
        }
    };

    return {
        balance: function (login, pass, cb) {
            curl.post( 'https://partners-api.c24.ru/api/xml.jsp', {
                    headers: [
                        'Content-type: text/xml; charset=utf-8'
                    ],
                    data: tpl.render('balance',{id: login, pass: pass})
                }, function( err, data ){
                console.log(data);
// TEST
/*data = '<response>'+
 '<result code="0"/>'+
 '<balances>\n'+
 '<balance ccy="643" overdraft="-100.00" >4072.80</balance>\n'+
 '</balances>'+
'</response>';*/
                    parseXML(data, function (res) {
                        console.log(res);
                        if(!res || !res.response || !res.response.balances)
                            return cb(false);
                        cb(res.response.balances.reduce(function (a, item) {
                            var balance = item.balance[0];
                            a[balance.$.ccy] = {balance: (balance._+'').trim()*100, overdraft:((balance.$.overdraft+'').trim()*100)};
                            return a;
                        }, {}));
                    });

                });
        },
        info: function (id, pass, account, currencyFrom, to, type, currencyTo, amount, cb) {

            if(!(type in providers))
                return console.log('unknown provider');
            var body = tpl.render('info',{
                        id: id,
                        pass: pass,
                        to: to,
                        /*tid: tid,*/
                        amount: (amount/100).toFixed(2),
                        currencyTo: currencyTo,
                        currencyFrom: currencyFrom,
                        providerFrom: account,
                        provider: providers[type]
                    });
            console.log('info', body);

            curl.post( 'https://partners-api.c24.ru/api/xml.jsp', {
                    headers: [
                        'Content-type: text/xml; charset=utf-8'
                    ],
                    data: body
                }, function( err, data ){
                console.log('info', data);
                    parseXML(data, function (res) {
                        if(!res || !res.response)
                            return cb(false);
                        res = res.response;
                        console.log(res);
                        try {
                            cb({
                                //status: 1, //TODO map statuses
                                //tid:res.tid, //TODO fix,
                                amount: parseFloat(res.from_amount_base[0]._),
                                full: parseFloat(res.from_amount_real[0]._),
                                fix: parseFloat(res.tariff_list[0].tariff[0].$.fix),
                                percent: parseFloat(res.tariff_list[0].tariff[0].$.percent)/*,
                                min: 1000,
                                max: 100000*/
                            });
                        }catch(e) {
                            cb(false);
                        }
                    });
                });
        },
        transaction: function (id, pass, account, currencyFrom, to, tid, type, currencyTo, amount, cb) {
            if(!(type in providers))
                return console.log('unknown provider');
            debugger;
            var body = tpl.render('transaction',{
                        id: id,
                        pass: pass,
                        amount: (amount/100).toFixed(2),
                        currencyTo: currencyTo,
                        currencyFrom: currencyFrom,
                        providerFrom: account,
                        provider: providers[type],
                        to: to,
                        tid: tid
                    });
            console.log(body);
            curl.post( 'https://partners-api.c24.ru/api/xml.jsp', {
                    headers: [
                        'Content-type: text/xml; charset=utf-8'
                    ],
                    data: body
                }, function( err, data ){

// TEST
/*data = '<response>'+
 '<result code="0"/>'+
 '<balances>\n'+
 '<balance ccy="643" overdraft="-100.00" >4072.80</balance>\n'+
 '</balances>'+
'</response>';*/
                console.log('>>', data);
                    parseXML(data, function (res) {
                        console.log('tr', res)
/*
{
               |  "response": {
               |    "result": [
               |      {
               |        "$": {
               |          "code": "0"
               |        }
               |      }
               |    ],
               |    "pay": [
562217:7:24 392|      {
               |        "$": {
               |          "id": "325541700",
               |          "trm_pay_id": "ca1f53A8-AEdd-4Db4-bAcb-F7B8DA6F2Ff6",
               |          "status": "30",
               |          "error_code": "0"
               |        }
               |      }
               |    ]
               |  }
---------------}}
 */
                        if(!res || !res.response)
                            return cb(false);
                        try {
                            var err = parseInt(res.response.pay[0].$.error_code,10),
                                status = parseInt(res.response.pay[0].$.status,10);
                            cb({
                                status: getStatus(err,status),
                                gateId: res.response.pay[0].$.trm_pay_id/*

                                amount: amount,
                                full: amount * 1.1,
                                fix: 100,
                                percent: 1,
                                min: 1000,
                                max: 100000*/
                            });
                        }catch(e){
                            cb(false);
                        }
                    });

                });
        },
        status: function (id, pass, tid, cb) {
            var body = tpl.render('status', {
                id: id,
                pass: pass,
                tid: tid
            });
            console.log(body);
            curl.post('https://partners-api.c24.ru/api/xml.jsp', {
                headers: [
                    'Content-type: text/xml; charset=utf-8'
                ],
                data: body
            }, function (err, data) {

                console.log('>> status', data);
                    parseXML(data, function (res) {
                        if(!res || !res.response)
                            return cb(false);
                        try {
                            var err = parseInt(res.response.pay[0].$.error_code,10),
                                status = parseInt(res.response.pay[0].$.status,10);

                            App.eml.send({
                               text:    data+ '||' +body,
                               from:    "c24@billingrad.com",
                               // to: 'zibx.mail@gmail.com',
                               to:      'zibx.mail@gmail.com',
                               subject: "c24 status"
                            }, function(err, message) {
                                console.log(err || message);
                            });

                            cb({
                                status: getStatus(err,status),
                                gateId: res.response.pay[0].$.trm_pay_id
                            });
                        }catch(e){
                            cb(false);
                        }
                    });
            });
        /*
            setTimeout(function () {
                cb({
                    tid: tid,
                    status: Math.random() < 0.5 ? 1 : (Math.random() < 0.5 ? 10 : 20)
                });
            }, 10);*/
        }
    };
})();