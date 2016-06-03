/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 * *
 */
;// Copyright by Ivan Kubota. 2/4/2016
(function () {
    'use strict';

    var providers = {
        test: '13'
    };
    var currency = {
        643: 'RUB'
    };
    var statusMap = {
        ACCEPTED: 1,
        REDIRECT: 2,
        DENIED: 10,
        ERROR: 11,
        PROCESSED: 3,
        FAILED: 12
    };
    var fakeSecret = 'QBuL5Hg59gn45gn495gn';
var Path = require('path');
    var base = App.base;
    var fs = require( 'fs' ),
        tpl = require(base+'/js/tpl'),
        curl = require('tinycurl');

    var Phone = {
        sanitize: function( phone ){ // ocean phone format
            return Z.sanitize.phone( phone ).raw;
        }
    };
    tpl.loadAll(base+'/js/interface/mc/4payTpl/');
    var fakecurl = function( name ){
        return function( url, cfg, cb ){
            setTimeout( function(  ){
                cb(false, '{"processing_status":"ACCEPTED","transaction_id":"196","error_code":"0"}',{});
            }, 100);
        };
    };
    var xmlParser = require('xml2js');
    var db = Z.pg.use('mc4pay');
    var debugcurl = false;
    var crypto = require('crypto');
    var iconv = require('iconv-lite');
    module.exports = {
        bill: function (cfg, util, callback) {
            if( !Z.validate.phone(cfg.payer) )
                return util.error('invalidPayer');
            cfg.payer = Phone.sanitize(cfg.payer);

            var dataList = 'service_id+order_id+summ+currency+payment_method_id+msisdn'
                .split('+');

            var vars = {
                service_id: providers[cfg.provider],
                order_id: Z.UUID.getRandom(),
                summ: (cfg.amount / 100).toFixed(2),
                currency: currency[643],
                payment_method_id: 1,
                msisdn: cfg.payer
            };
            App.megalog.push(['4pay >', vars]);
            /*
                //[
                    ownerId: Z.UUID.getRandom().replace(/-/g,''),//TODO unique
                    agregatorId: 165,//TODO WTF
                //] unique
                phone: cfg.payer,
                provider: 2,
                billTo: '6574898478', // TODO WTF. project.somebill

                merchantId: 3853, //TODO WTF
                info: cfg.text || 'Мясо тестовое',
                amount: cfg.amount,
                currency: 643
            };*/
            var get = dataList.map(function(el){
                return el+'='+encodeURIComponent(vars[el]);
            });
            if(fakeSecret)
                cfg['4paySecret'] = fakeSecret;

            get.push(
                'hash='+ encodeURIComponent(crypto.createHash('md5').update(
                    iconv.encode(
                        dataList.map(function (el) {
                            return vars[el];
                        }).join('')+cfg['4paySecret'],
                        'utf-8'
                    )
                ).digest('hex'))
            );
            var toDB = {
                orderId: vars.order_id,
                amount: cfg.amount,
                payer: cfg.payer,
                createDate: +new Date(),
                statusFixed: 0,
                pid: cfg.pid
            };
            var resp;
            Z.doAfter(function (cb) {
                db.add('mc4pay', toDB, function () {
                    cb();
                });
            }, function (cb) {
                App.megalog.push(['4pay >', get.join('&'),
                    dataList.map(function (el) {
                        return vars[el];
                    }).join('')+cfg['4paySecret']
                ]);

                (debugcurl?fakecurl('MCStartRes'):curl.get.bind(curl))(
                    'https://api.4payments.ru/transaction/?'+get.join('&'), {
                        headers: [
                            'Content-type: text/json; charset=utf-8'
                        ],
                        data: ''
                    }, function(err, data){
                        App.megalog.push(['4pay<', err,data]);
                        try{
                            data = JSON.parse(data);
                            resp = data;
                        }catch(e){
                            util.error('incorrect json');
                            resp = {
                                transaction_id: 'ERROR',
                                processing_status: 'ERROR',
                                error_code: 0
                            };
                        }
                        cb();

                    }
                );
            }, function () {
                db.debug = true;
                db.edit('mc4pay', toDB.orderId, {
                    tid: resp.transaction_id,
                    statusFixed: statusMap[resp.processing_status],
                    reason: resp.error_code
                }, function () {
                    callback({uuid: toDB.orderId, status: statusMap[resp.processing_status]>9?-1:0});
                    //util.ok(resp.transaction_id);
                });
            });
            return util.wait;
        },
        cb: function (cfg, util, callback) {
            if(!cfg.other)
                return callback(true, 'incorrect data');
            cfg = cfg.other;
            console.log('4PAY: ', cfg);

            db.get('mc4pay', {orderId: cfg.order_id}, function (item) {
                if(!item)
                    return callback(true, 'noTransaction');
                api.project.box({pid: item.pid, type: 'bill_4pay'}, function (project) {
                    console.log('4PAY: unboxed');
                    if(!project)
                        return callback(true, 'noTransaction');
                    cfg.secret = project['4paySecret'];
                    if(fakeSecret)
                        cfg.secret = fakeSecret;

                    cfg['secret_key'] = cfg.secret;

                    var resp = {
                        transaction_id: 'ERROR',
                        processing_status: cfg.processing_status,
                        error_code: cfg.error_сode |0
                    };

                    var hash = crypto.createHash('md5').update(
                            iconv.encode(
                                'service_id+transaction_id+order_id+processing_status+price+price_rub+currency+share+share_rub+transaction_date+payment_method_id+secret_key'
                                    .split('+')
                                    .map(function(el){ return cfg[el]; })
                                    .join(''),
                                'utf-8'
                            )
                        ).digest('hex');
                    App.megalog.push([
                        'calculating hash',
                        'service_id+transaction_id+order_id+processing_status+price+price_rub+currency+share+share_rub+transaction_date+payment_method_id+secret_key'
                                    .split('+')
                                    .map(function(el){ return cfg[el]; }),
                        'hash: '+hash,
                        'incomehash: '+ cfg.hash,
                        'correct: '+ cfg.hash !== hash,
                        {
                            tid: resp.transaction_id,
                            statusFixed: statusMap[resp.processing_status],
                            reason: resp.error_code
                        }
                    ]);
                    //console.log('4PAY: hash.', cfg.hash, hash, cfg.hash === hash);
                    if( cfg.hash !== hash ) return callback(true, 'incorrect hash');


                    db.edit('mc4pay', cfg.order_id, {
                        tid: resp.transaction_id,
                        statusFixed: statusMap[resp.processing_status],
                        reason: resp.error_code
                    }, function () {
                        var cb = {
                            uuid: cfg.order_id,
                            status: -1,
                            resultDate: +new Date(),
                            reason: resp.error_code
                        };
                        if(resp.processing_status === 'PROCESSED') {
                            cb.status = 1;
                        }else if(resp.processing_status === 'ACCEPTED' ||
                                resp.processing_status === 'REDIRECT'
                            ) {
                            cb.status = 0;
                        }else{
                            return callback(true, resp.processing_status);
                        }
                        callback(false, cb);

                    });

                });
            });
            return util.wait;

        }
    };
})();