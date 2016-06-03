var connection = 'smscenter';//'mock';
var price = 0.5;
var interfaces = Z.include('./js/interface/smsGate/', function(  ){
    connections = {};
    Z.each( App.cfg.smsGates, function( gate, cfg ){
        Z.each(cfg, function( name, cfg ){
            connections[name] = cfg;
            cfg.interface = interfaces[gate];
        });
    });
});
exports = module.exports = {
    request: function( pid, phone, util, user ){
        /*
        Получение HLR
        #in#
            pid:hash - project id
            phone:phone - телефон

        #ok
            {"send_date":"04.08.2014 16:34:34","phone":"7XXXYYYYYYY","country":"Россия","operator":"Билайн","region":"Москва"}
        #errors
            Проект с данным id отсутствует
            #error
                noSuchProject
            Недостаточно средств
            #error
                notEnoughMoney
            Слишком частые запросы (на один номер можно запрашивать HLR не чаще раза в 2 минуты)
            #error
                timeout
        */

        var connect = connections[connection];
        if( Z.validate.phone(phone) ){
            phone = Z.sanitize.phone(phone ).raw;

            api.project.get({id: pid}, function( project ){
                if( project && (project.creator === user._id || user._id==='USERNAME') ){
                    api.balance.get({owner: pid, from: pid}, function( wallet ){
                        if( wallet ){
                            if( wallet.amount - price > -100 ){
                                connect.interface.hlr.call(connect, phone, function( data ){
                                    if( data === false )
                                        util.error('timeout');
                                    else{
                                        api.balance.transaction({
                                            minus: 500,
                                            id: wallet.id,
                                            to: 'THEWALLET',
                                            amount: price,
                                            user: {_id: pid}
                                        }, function(  ){
                                            // maybe move here
                                        });
                                        util.ok(data);
                                    }
                                });

                            }else{
                                util.error('notEnoughMoney');
                            }
                        }else{
                            util.error('noWallet');
                        }
                    });
                }else{
                    util.error('noSuchProject');
                }
            });

        }else{
            util.error('phoneInvalid');
        }

        return util.wait;
    }
};