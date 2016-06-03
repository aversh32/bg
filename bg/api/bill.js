/**
 * Created by Ivan on 10/8/2014.
 */
var interfaces = {};
/*
BILL.
 Project that want to use bill module should be approved.
 project can have bill_$type variable box with specific config

INTERFACE MANUAL
 interface should be placed in js/interface/mc or js/interface/premium
 interface should have `bill` method
*/
Z.include('./js/interface/mc/', function( obj ){
    Z.apply( interfaces, obj );
});
Z.include('./js/interface/premium/', function( obj ){
    Z.apply( interfaces, obj );
});

var types = {
    //mc: 'ruru',
    mc: '4pay', //ocean
    premium: 'paystream' // mt - платная смс на короткий номер
},
    db = Z.pg.use('bill');
exports = module.exports = {
    create: function( additional, text, payer, category, gate, pid, type, amount, util, user ){
        /*
        Выставление счёта
        #in#
            pid: project-id - ID проекта
            amount: int - планковская цена (копейки)
            type: enum - тип платежа. mc - mobile commerce
            payer: string - плательщик (номер телефона, реквизиты)
            category: string - категория платежа
            [text]: string - описание платежа
            [additional]: json - дополнительные параметры, которые можно использовать в шаблоне настройки оповещения
        #out
            #ok
                bill-id
            #errors
                Невалидный плательщик
                #error
                    invalidPayer
                Данный тип платежа требует указания текста назначения
                #error
                    needText
                Невалидный тип платежа
                #error
                    invalidType
                Проект с указанным id не существует || нет прав на удаление
                #error
                    noSuchProject
        #can user bill.create in project: pid

        */

        gate = gate || types[type];

        if( gate === void 0 )
            return util.error('invalidType');

        api.project.box({pid: pid, type: 'bill_'+ gate}, function (project) {
            if(!project)
                return util.error('invalidProject');



            var iface = interfaces[ gate ],
                cfg = Z.apply(Z.apply({}, project), {
                    payer: payer,
                    amount: amount,
                    text: text,
                    provider: 'test',
                    pid: pid
                });
            console.log(iface, interfaces);
            iface.bill.call( App.cfg[ type ][gate], cfg, util, function( res ){

                var toDB = {
                    pid: pid,
                    uuid: res.uuid,
                    amount: amount,
                    payer: payer,
                    createDate: +new Date(),
                    status: res.status,
                    text: text,
                    additional: JSON.stringify(additional),
                    type: type,
                    category: category
                };

                db.add('bill', toDB, function( err, res ){
                    App.megalog.push(['bill.create', err, res]);
                    util.ok(res.bid);
                });

                //console.log(toDB);

            } );
        });
        return util.wait;
    },
    cb: function( type, g, _body, data, util ){
        var gate = g || types[type];

        if( gate === void 0 )
            return util.error('invalidType');

        var cfg = {data: _body, other: data};
        var iface = interfaces[ gate ];
        App.megalog.push(['bill.cb', {type:type, g: g}]);
        iface.cb && iface.cb.call( App.cfg[ type ][gate], cfg, util, function( err, res ){
            App.megalog.push(['bill.cb 1', err, res]);
            if( err )
                return util.error(res);

            db.getList('bill', 'uuid', res.uuid, function( obj ){
                var bill = obj[0];
                db.edit('bill', bill.bid, res);
                App.megalog.push(['bill.cb 2', obj]);
                if( bill.status != res.status ){
                    var ad = {};
                    try{
                        ad = JSON.parse(bill.additional)
                    }catch(e){}
                    bill.additional = ad;
                    var data = Z.apply(Z.apply({}, bill), res);
                    data.id = data.bid;

                    data.status = {'-1':'fail',1:'success'}[data.status] || 'process';
                    App.megalog.push('bill.cb 3', data.status);
                    if( data.status == 'success' ){
                        var val = bill.amount;
                        api.balance.get({owner: bill.pid, user: App.setSecurityFlag({_id: 'USERNAME'})},function(a){
                           api.balance.transaction({
                               id: 'THEWALLET', user: App.setSecurityFlag({_id: 'USERNAME'}),
                               amount: val/100, to:a.id
                           },function(a){

                           });
                        });

                    }
                    api.response.send({
                        pid: bill.pid,
                        type: type,
                        data: data,
                        amount: a.data.id
                    });

                }

            })

        } );


        return util.wait;
    },
    info: function( bid, pid, util, user ){
        /*
        Информация о состоянии платежа
        #in#
            pid: project-id - ID проекта
            bid: bill-id - ID платежа
        #can user bill.info in project: pid
         */
        //console.green(1+'!'+bid);
        App.megalog.push(['bill.info', {bid:bid, pid: pid}]);
        db.get('bill', bid, function( obj ){
            App.megalog.push(['bill.info obj', obj]);
            if(!obj || obj.pid !== pid)
                return util.error('noSuchBill');
            util.ok(obj);
        });
        return util.wait;
    }
};
