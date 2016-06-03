(function(){

    var Path = require('path');
    var base = App.base;
    var fs = require( 'fs' ),
        tpl = require(base+'/js/tpl'),
        curl = require('tinycurl');

    var Phone = {
        sanitize: function( phone ){ // ocean phone format
            return Z.sanitize.phone( phone ).raw.substr(1);
        }
    };
    tpl.loadAll(base+'/js/interface/mc/oceanTpl/');
    var fakecurl = function( name ){
        return function( url, cfg, cb ){
            setTimeout( function(  ){
                cb(false, tpl.render(name),{});
            }, 100);
        };
    };
    var xmlParser = require('xml2js');
    var db = Z.pg.use('mcocean');
    var debugcurl = false;
    var crypto = require('crypto');
    var iconv = require('iconv-lite');
    exports = module.exports = {
        bill: function( cfg, util, callback ){
            if( !Z.validate.phone(cfg.payer) )
                return util.error('invalidPayer');

            cfg.payer = Phone.sanitize(cfg.payer);
            var vars = {
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
            };
            vars.hash = crypto.createHash('md5').update(
                iconv.encode(
                    [
                        vars.ownerId,
                        vars.phone,
                        vars.provider,
                        vars.amount,
                        vars.currency,
                        vars.billTo,
                        vars.info,
                        'kuTku%yr$tgr)polkiuj'
                    ].join(''),
                    'win1251'
                )
            ).digest('base64');

/*
1)	Owner.id,
2)	Client.Phone.number,
3)	Client.Phone.provider,
4)	Payment.amount,
5)	Payment.currency,
6)	Message.bill,
7)	Message.comment,
8)	секретный пароль Агрегатора.
*/

            var soapXML = tpl.render('MCStartReq', vars);
            //App.megalog.push({mcocean: {start: soapXML}});

            (debugcurl?fakecurl('MCStartRes'):curl.post.bind(curl))(
                //TODO OCEAN URL
                'https://mobicom.oceanbank.ru/processing/',
                {
                    headers: [
                        'SOAPAction:"urn:mobicomStart"',
                        //'SOAPAction:http://ruru.ru/serviceprovider/ITransactionService/Init',
                        'Content-type: text/xml; charset=utf-8'
                    ],
            //        verbose: true,
                    data: soapXML
                }, function( err, data ){
                    //App.megalog.push({mcocean: {startresp: data}});
                    console.logModule('OCEAN','XML',data);
                    var xmlObj = xmlParser.parseString( data, function( err, data ){
                        console.logModule('OCEAN',data);
                        var body = data['soap:Envelope']['soap:Body'][0];

                        var toDB = {
                            tid: vars.ownerId,
                            aid: vars.agregatorId,
                            billTo: vars.billTo,
                            amount: cfg.amount,
                            payer: cfg.payer,
                            createDate: +new Date(),
                            info: vars.info
                        };
                        if( body['soap:Fault'] ){
                            toDB.status = 4;
                            toDB.statusInfo = body['soap:Fault'][0]['soap:Reason'][0]+'';
                        }else{
                            var resp = body['ns1:MCStartRes'][0]['ns1:Result'][0];
                            var out = {};
                            //debugger;
                            for( var i in resp )
                                out[i] = resp[i] + '';
                            toDB.status = out['ns1:code'];
                            toDB.statusInfo = out['ns1:comment'];
                        }
                        App.megalog.push({payment_data:[toDB]});
                        db.add('mcocean', toDB, function( err, res ){
                            callback({uuid: toDB.tid, status: out['ns1:code'] == 0 ? 0 : -1});
                        });
                        console.log(toDB);

                    });

                    console.log(data);

                }
            );

        },
        cb: function( cfg, util, callback ){
            return;
            App.megalog.push({oceanCB:[util.response.req.headers, cfg.data]});
            if(!cfg)
                return;
            var d = cfg.data+'';
            if(!d || !cfg.data)
                return;
            try {
                console.logModule('ocean', d);
                var xmlObj = xmlParser.parseString(d, function (err, data) {
                    if(err)
                        return;
                    App.megalog.push({oceanCBParsed: {d: data}});
                    var body = data['soap:Envelope']['soap:Body'][0],
                        req = body['ns1:MCRegistReq'][0],
                        tid,
                        oid,
                        vars = {
                            agregatorId: req['ns1:Agregator'][0]['ns1:id'] + '',
                            merchantId: req['ns1:Merchant'][0]['ns1:id'] + '',
                            ownerId: oid = req['ns1:Owner'][0]['ns1:id'] + '',
                            phone: req['ns1:Client'][0]['ns1:Phone'][0]['ns1:number'] + '',
                            amount: req['ns1:Payment'][0]['ns1:amount'] + '',
                            'TransactionId': tid = req['ns1:Transaction'][0]['ns1:id'] + ''
                        };
                    util.stringify = function (data) {
                        return data.data;
                    };
                    App.megalog.push({oceanCBResp: {vars: vars, tid: tid}});

                    db.get('mcocean', {'tid': oid}, function (item) {
                        console.dir(item);
                        if (item) {

                            vars.info = item.info;
                            var resp = tpl.render('MCRegistRes', vars);
                            App.megalog.push({oceanCBRespXML: resp});
                            util.ok(resp);
                            db.edit('mcocean', oid, {ocid: tid, status: req['ns1:Payment'][0]['ns1:result'] + ''})
                        } else {
                            vars.info = 'FAIL';
                            var resp = tpl.render('MCRegistRes', vars);
                            util.ok(resp);
                        }
                    });

                });
            }catch(e){

            }

        }
    };
    var checkInterval = 10000;
    false && setTimeout( function(  ){ // Interval
        App.action('ocean-status-request', checkInterval, function(err, data){
            db.getList('mcocean','statusFixed', 0, function( rows ){
                rows.forEach( function( el ){
                    var vars = {
                        agregatorId: el.aid,
                        transactionId: el.tid
                    };
                    vars.hash = crypto.createHash('md5').update(
                        iconv.encode(
                            [
                                vars.transactionId,
                                'kuTku%yr$tgr)polkiuj'
                            ].join(''),
                            'win1251'
                        )
                    ).digest('base64');
                    var soapXML = tpl.render('MCStatusReq', vars);
                    App.megalog.push({mcocean: {status: soapXML}});

                    (debugcurl?fakecurl('MCStatusRes'):curl.post.bind(curl))(
                        //TODO OCEAN URL
                        'https://mobicom.oceanbank.ru/processing/',
                        {
                            headers: [
                                'SOAPAction:"urn:mobicomRequest"',
                                //'SOAPAction:http://ruru.ru/serviceprovider/ITransactionService/Init',
                                'Content-type: text/xml; charset=utf-8'
                            ],
                    //        verbose: true,
                            data: soapXML
                        }, function( err, data ){
                            App.megalog.push({mcocean: {statusresp: data}});
                            var xmlObj = xmlParser.parseString( data, function( err, data ){
                                return;
                                //debugger;
                                var resp = data['soap:Envelope']['soap:Body'][0]['ns1:MCStartRes'][0]['ns1:Result'][0];
                                var out = {};
                                //debugger;
                                for(var i in resp)
                                    out[i] = resp[i]+'';
                                var toDB = {
                                    tid: vars.ownerId,
                                    aid: vars.agregatorId,
                                    billTo: vars.billTo,
                                    amount: cfg.amount,
                                    payer: cfg.payer,
                                    createDate: +new Date(),
                                    status: out['ns1:code'],
                                    statusInfo: out['ns1:comment'],
                                    info: vars.info
                                };
                                App.megalog.push({payment_data:[toDB]});
                                db.add('mcocean', toDB, function( err, res ){
                                    callback({uuid: toDB.tid, status: out['ns1:code'] == 0 ? 0 : -1});
                                });
                                console.log(toDB);

                            });

                            console.log(data);

                        }
                    );

                });

            });
        });
    }, checkInterval);
    var test = function(  ){
        debugcurl = true;
        api.bill.create({
            pid: '048f198c15d6c5df93e379ae310086df',
            user: {_id: "9200c4b692fec3d7b6c417db9f05de40"},
            amount: 1000,
            type: 'mc',
            gate: 'ocean',
            payer: '79164819441',
            category: 7
        });
    };
    //setTimeout(test,5000);

})();

