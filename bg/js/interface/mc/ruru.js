(function(){
    /*exports = module.exports = {
        bill: function( cfg, util, callback ){
            callback();
        },
        cb: function( util, callback ){
            callback(true);
        }
    };
    var base = App.base;
    App.megalog.push('rurutpl: '+base+'/js/interface/mc/ruruTpl/');
    App.megalog.push('tpl: '+base+'/js/tpl');
    return;*/

    var Path = require('path');
    var base = App.base;
    var fs = require( 'fs' ),
        tpl = require(base+'/js/tpl'),
        curl = require('tinycurl');

    tpl.loadAll(base+'/js/interface/mc/ruruTpl/');

/*
    var soapXML = tpl.render('init', {
        phone: '9031111111',
        date: (new Date().toISOString().replace( /T/, ' ' ).replace( /\..+/, '' )),
        info: 'testing',
        pid: '3868',
        service: '1436',
        amount: '1000'
    });
//var


curl.post(
    'https://178.20.234.188/RuRu.FrontEnd.ServiceProvider/TransactionService.svc', {
        headers: [
            'SOAPAction:http://ruru.ru/serviceprovider/ITransactionService/Init',
            'Content-type: text/xml; charser=utf-8'
        ],
        verbose: true,
        key: base+'/js/interface/mc/rurucert/key.pem',
        cert: base+'/js/interface/mc/rurucert/cert.pem',
        cacert: base+'/js/interface/mc/rurucert/demorootca.cer.pem',
        data: soapXML
    }, function( err, data ){
        console.log(data);
    }
).on('stderr', function( data ){
        console.log(data.toString());
    });
    //
    /*var xmlObj = xmlParser.parseString(
        '<s:Envelope xmlns:s="http://schemas.xmlsoap.org/soap/envelope/"><s:Body><InitResponse xmlns="http://ruru.ru/serviceprovider/"><InitResult xmlns:i="http://www.w3.org/2001/XMLSchema-instance"><ErrorCode>0</ErrorCode><Id>359161235</Id><Info>Платеж поставлен в очередь на обработку</Info><Signature i:nil="true"/><TimeOut1>33</TimeOut1><TimeOut2>33</TimeOut2></InitResult></InitResponse></s:Body></s:Envelope>',
        function( err, data ){
            var resp = data['s:Envelope']['s:Body'][0]['InitResponse'][0]['InitResult'][0];
            var out = {};
            for(var i in resp)
                out[i] = resp[i]+'';
            console.green(JSON.stringify(out,true,2));
        }
    );*/
    var xmlParser = require('xml2js');
    var db = Z.pg.use('mcruru');

    var ruruDate = function( date ){
        return (new Date(date || new Date()).toISOString().replace( /T/, ' ' ).replace( /\..+/, '' ));
    };
    exports = module.exports = {
        bill: function( cfg, util, callback ){

            if( !Z.validate.phone(cfg.payer) )
                return util.error('invalidPayer');

            cfg.payer = Z.sanitize.phone(cfg.payer ).raw.substr(1);
            var soapXML = tpl.render('init', {
                phone: cfg.payer,
                date: ruruDate(),
                info: cfg.text,
                pid: '34823',
                service: '1468',
                amount: cfg.amount
            });
            App.megalog.push({mcr: {xml: soapXML}});
            curl.post(
                'https://130.193.66.56/RuRu.FrontEnd.ServiceProvider/TransactionService.svc',{///https://178.20.234.188/RuRu.FrontEnd.ServiceProvider/TransactionService.svc', {
                    headers: [
                        'SOAPAction:http://ruru.ru/serviceprovider/ITransactionService/Init',
                        'Content-type: text/xml; charset=utf-8'
                    ],
                    verbose: true,
                    key: App.cfg.mc.ruru.key,//'./js/interface/mc/rurucert/key.pem',
                    cert: App.cfg.mc.ruru.cert,//'./js/interface/mc/rurucert/cert.pem',
                    data: soapXML
                }, function( err, data ){
                    console.log(err);
                    App.megalog.push({mcr: {resp: data}});
                    var xmlObj = xmlParser.parseString( data, function( err, data ){
                        var resp = data['s:Envelope']['s:Body'][0]['InitResponse'][0]['InitResult'][0];
                        var out = {};
                        //debugger;
                        for(var i in resp)
                            out[i] = resp[i]+'';
                        var toDB = {
                            uuid: Z.UUID.getRandom(),
                            ruruId: out.Id,
                            amount: cfg.amount,
                            payer: cfg.payer,
                            createDate: +new Date(),
                            status: out.ErrorCode,
                            info: out.text
                        };
                        App.megalog.push({payment_data:[toDB]});
                        db.add('mcruru', toDB, function( err, res ){
                            callback({uuid: toDB.uuid, status: out.ErrorCode == 0 ? 0 : -1});
                        });
                        console.log(toDB);

                    });

                    console.log(data);

                }
            );
        },
        cb: function( cfg, util, callback ){

            App.megalog.push({ruruAnswer:[util.response.req.headers]});
            var tokens = util.response.req.headers['x-original-url'].split('?');
            tokens.shift();

            var data = tokens.join('?')
                .replace(/^\?/,'')
                .split('&')
                .reduce(function(a,b){
                    var tokens = b.split('=');
                    a[decodeURIComponent(tokens[0])] = decodeURIComponent(tokens[1]);
                    return a;
                },{});
            App.megalog.push({ruruAnswer:[data]});
            if( data.id ){
                console.log(data);
                db.getList('mcruru', 'ruruId', data.id, function( list ){
                    var obj = list[0];
                    if( obj ){
                        App.megalog.push({payment_data_from_db:[obj]});
                        var cb = {
                            uuid: obj.uuid
                        },
                            update,
                            resp;
                        if( data.action === 'cancelinit' ){
                            update = {
                                reason: data.reason,
                                resultDate: +new Date(),
                                status: -1
                            };
                            cb.status = -1;
                            cb.resultDate = update.resultDate;
                            resp = tpl.render('resCancelInit', {
                                willCallback: 'false',
                                date: ruruDate(),
                                id: data.id,
                                externalId: data.externalId,
                                amount: obj.amount,
                                error: 0
                            });
                        }else if( data.action === 'init' ){
                            var dat = {
                                willCallback: 'false',
                                date: ruruDate(),
                                id: data.id,
                                externalId: data.externalId,
                                amount: obj.amount,
                                error: 0
                            };
                            if(obj.amount=='1366613'){
                                dat.error = 1;
                                dat.errorDescription = 'Штормовой ветер';
                            }

                            cb.status = 0;
                            resp = tpl.render('resInit', dat);
                        }else if( data.action === 'payment' ){
                            update = {
                                willCallback: 'false',
                                reason: data.reason,
                                resultDate: +new Date(),
                                status: -1
                            };
                            cb.status = 1;
                            cb.resultDate = update.resultDate;
                            resp = tpl.render('resPayment', {
                                willCallback: 'false',
                                date: ruruDate(),
                                id: data.id,
                                externalId: data.externalId,
                                amount: obj.amount,
                                error: 0
                            });
                        }else{
                            return callback( true );
                        }

                        util.stringify = function( data ){
                            return data.data;
                        };
                        util.ok(resp);
                        App.megalog.push({ourAnswer:[resp]});
                        update && db.edit( 'mcruru', data.id, update );
                        callback( false, cb );
                    }else{
                        callback( true );
                    }
                });

            }else{
                callback(true);
            }


        }
    };



})();