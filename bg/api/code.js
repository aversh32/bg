/**
 * Created by Ivan on 7/20/2015.
 */
module.exports = {
    send: function (phone, text, pid, util, user) {
        /*
        Отправить код двойной авторизации
        #in#
            pid: hash - ID проекта
            phone: phone - телефон
            text: text - Произвольный текст смс сообщения. "{code}" в тексте будет заменено на код подтверждения.
        #out
            #ok
                true

            #errors
                Недостаточно денег
                #error
                    notEnoughMoney

        #can user delivery.send in project: pid
        */
        api.project.get({id: pid}, function (project) {
            if(!project)
                return util.error('noSuchProject');
            api.balance.get({owner: pid, from: pid}, function( wallet ) {
                if (!wallet)
                    return util.error('noWallet');

                api.costs.calculate({
                    pid: pid,
                    service: 'smsCode',
                    data: [{count: 1}]
                }, function (result) {
                    var credit = project.credit || 0,
                        money = wallet.amount * 100;

                    if (money + credit < result.price)
                        return util.error({text: 'notEnoughMoney', mid: message.mid});
                    api.costs.transaction({
                        pid: pid,
                        service: 'smsCode',
                        data: [{count: 1}]
                    }, function (result) {
                        if (result) {
                            api.sms.sendCode({
                                phone: phone,
                                text: text,
                                sjendir: project.serviceSender || ''
                            }, function (data,a) {
                                util.ok(true);
                            });
                        }else{
                            util.error()
                        }
                    });

                });
            });
        });
        return util.wait;

    },
    check: function (phone, code, util, user) {
        /*
        Проверка правильности кода. Внимание, логику количества попыток надо реализовывать на своей стороне.
        #in#
            phone: phone - телефон
            code: text - Код

        #out
            #ok
                true

            #errors
                Не валидный
                #error
                    false

        */

        code = (code +'').replace(/[^a-zA-Z0-9]/g,'');

        api.sms.checkCode({phone: phone, code: code}, function (data) {
            console.log('checkCode', data);
            if(data)
                return util.ok(true);
            else
                return util.error(false);
        });
        return util.wait;
    }
};