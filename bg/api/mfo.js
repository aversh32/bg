/**
 * Created by Ivan on 6/8/2015.
 */
var statusCodes = {

    0: {text: 'Proceed'},

    10: {text: 'Success'},
    20: {text: 'Fail'},

    21: {text: 'Fail.minAmount'},
    22: {text: 'Fail.maxAmount'},
    23: {text: 'Fail.accountValidation'},
    30: {text: 'Fail.bankAccount'},
    31: {text: 'Fail.bankRetryLater'},
    32: {text: 'Fail.accountNotFound'},
    40: {text: 'Fail.bankTechLater'},
    50: {text: 'Fail.notEnoughMoney'},
    70: {text: 'Fail.notProceeded'},
    71: {text: 'Fail.alreadyProceeded'},
    100: {text: 'Mystery'}
};
var safeAccount = function (el) {
    return {
        type: el.type,
        amount: el.lastAmount,
        aid: el.aid,
        name: el.name
    };
};
var interfaces = {};
Z.include('./js/interface/mfo/', function( ifaces ){
    interfaces = ifaces;
    console.log('c24',ifaces.c24);
});
var db = Z.pg.use('mfo');
var moment = require('moment');
var types = Z.a2o('card,account'.split(','));
exports = module.exports = {
    create: function (pid, name, util, user) {
        /*
        Создание списка транзакций
        #in#
            pid: hash - id проекта
            [name]: string - название списка
        #ok
            transaction-list-id (lid)

        #errors#
            Имя задано, но не строка или длина привышает 128 символов
            #error
                Incorrect name
        #can user mfo.transaction in project: pid
        */
        if(!name)
            name = 'Transaction ' + moment().format('YYYY-MMM-DD HH:mm:ss');

        if(typeof name !== 'string' || name.length > 128)
            return util.error('Incorrect name');
        db.add('list', {
            createDate: new Date(),
            pid: pid,
            name: name
        }, function (err, l) {
            return util.ok(l.lid);
        });
        return util.wait;
    },
    balance: function (pid, user, util) {
        /*
        Получение баланса связанных с проектом аккаунтов
        #in#
            pid: hash - id проекта

        #can user mfo.balance in project: pid
        #ok
            [{amount: баланс, aid: ид-аккаунта, name: название, type: имя-шлюза}]
        */
        db.getList('account', 'pid', pid, function (list) {

            var waiter = new Z.wait(function () {
                util.ok(list.map(safeAccount));
            });
            waiter.add(list.length);
            if(!list.length)
                return util.ok([]);

            list.forEach(function (item) {

                var iface = interfaces[item.type];
                if(!iface){
                    return console.log('ERROR, no mfo `'+item.type+'`');
                }
                var waitTimeout = setTimeout(function () {
                    console.log('gate timeout (balance)', item.type);
                    waiter.done();
                }, 5000);
                iface.balance.call(item, item.bankid, item.bankpass, function (data) {
                    if(data) {
                        var cur = data[item.currency];
                        db.edit('account', item.aid, {
                            lastAmount: item.lastAmount = cur.balance,
                            lastOverdraft: item.lastOverdraft = (cur.overdraft||0),
                            lastAmountDate: new Date()
                        });
                    }
                    clearTimeout(waitTimeout);
                    waiter.done();
                });
            });
        });
        return util.wait;
    },
    transaction: function (pid, lid, aid, to, type, text, amount, currency, info, user, util) {
        /*
        Create transaction
        #in#
            [pid]: project-id - required if lid is not specified
            [lid]: transaction-list-id - required if pid is not specified

            [text]: text - optional comment
            [aid]: from-account-id - can be not specified, but only if there is a single account in project

            [type=card]: text - type of recipient (default value is - card).
            to: text - account identifier (credit card number)
            [currency]: number - code of currency (rub is 643). Required if aid is not specified or if there are more than one aid in project and aid is not specified but you know that account with exact currency is only one (strange case)
            amount: number - amount of money to transfer.  in minimal currency (копейки)
            [info=false]: boolean - do not create transaction, get prices

        #ok
            transaction-id
        For info=true look at method mfo.info, it works same way, but can predict account and other things that transaction method do

        #errors
            Неподдерживаемый тип транзакции (проверьте type)
            #error
                Unsupported transaction type: переданное_название_типа

            Поле text задано, но в нём не текст
            #error
                text arg should be string or undefined

            Amount должен быть больше нуля
            #error
                Amount should be positive

            Платежный аккаунт не из этого проекта (проверьте aid)
            #error
                No accounts in project `project-id`

            Aid не задан и в проекта имеется более чем один аккаунт
            #error
                There are more than one account with such currency. Please specify aid

            Задано поле currency, но не задан aid. При этом в проекте более одного аккаунта с такой валютой и мы не будем угадывать нужный.
            #error
                There are more than one account with such currency. Please specify aid or currency

            указан не существующий aid
            #error
                no such account

            указан aid не принадлежащий проекту
            #error
                Account does not belongs to project `ид_проекта`

         */
        info = !!info;
        if(!type)
            type = 'card';
        if(!(type in types))
            return util.error('Unsupported transaction type: '+type);
        if(text === void 0 || isNaN(text) || text === null )
            text = '';
        text = text + '';

        if( !(typeof text === 'string') )
            return util.error('text arg should be string or undefined');

        var account;
        amount = parseFloat(amount);
        if( amount < 0 )
            return util.error('Amount should be positive');

        Z.doAfter(function (cb) {

            if (!lid) {
                api.mfo.create({
                    pid: pid,
                    user: user
                }, function (id) {
                    if (!id) // TODO: test
                        return util.error('can not create');
                    lid = id;
                    cb();
                });
            } else if (pid) {
                db.get('list', {lid: lid}, function (list) {
                    pid = list.pid;
                    cb();
                });
            }
        }, function (cb) {
            if(!aid){
                db.getList('account', 'pid', pid, function (list) {
                    if(list.length===0)
                        return util.error('No accounts in project `'+pid+'`');
                    else{
                        var filtered = list.filter(function(el){
                            return !currency || el.currency === currency;
                        });
                        if(filtered.length > 1){
                            if(currency)
                                return util.error('There are more than one account with such currency. Please specify aid');
                            else
                                return util.error('There are more than one account with such currency. Please specify aid or currency');
                        }else {
                            account = filtered[0];
                            cb();
                        }
                    }
                });
            }else{
                db.get('account', aid, function (acc) {
                    if(!acc)
                        return util.error('no such account');
                    account = acc;
                    cb();
                });
            }
        }, function () {
            if(account.pid!==pid)
                return util.error('Account does not belongs to project `'+ pid +'`');
            currency = currency || account.currency || 643;
            if(info){
                //get info
                api.mfo.info({
                    pid: pid,
                    aid: account.aid,
                    to: to,
                    type: type,
                    amount: amount,
                    currency: currency,
                    user: user,
                    util: util
                });
            }else{
                // create transaction
                util.inside = true;
                api.mfo._transaction({
                    pid: pid,
                    lid: lid,
                    account: account,
                    to: to,
                    type: type,
                    text: text,
                    amount: amount,
                    currency: currency,
                    user: user,
                    util: util,
                    info: info
                });
            }

        });
        return util.wait;
    },
    info: function (pid, aid, to, type, amount, currency, user, util) {
        /*
        Получение комиссий
        #in#
            pid: project-id - required if lid is not specified

            aid: from-account-id - can be not specified, but only if there is a single account in project

            [type=card]: text - type of recipient (default value is - card).
            [to]: text - account identifier (credit card number)
            [currency]: number - code of currency. default is account currency
            amount: number - amount of money to transfer. in minimal currency (копейки)

        #ok
            {full: full_price, fix: fixed_commission, percent: percent_commission (0.00-100.00), min: smallest_available_transaction, max: max_available_transaction}

        #errors
            Неподдерживаемый тип транзакции (проверьте type)
            #error
                Unsupported transaction type: переданное_название_типа

            указан не существующий aid
            #error
                no such account
        #can user mfo.transaction in project: pid
        */

        if(!type)
            type = 'card';
        if(!(type in types))
            return util.error('Unsupported transaction type: '+type);

        db.get('account', {aid: aid}, function (account) {
            if(!account)
                return util.error('no such account');
            currency = currency || account.currency || 643;
            var iface = interfaces[account.type];
            if (!iface) {
                return console.log('ERROR, no mfo `' + account.type + '`');
            }

            iface.info.call(account,
                account.bankid,
                account.bankpass,
                account.bankClient,
                account.currency,
                to,
                type,
                currency,
                amount, function (data) {
                    util.ok(data);
                }
            );
        });

        return util.wait;
    },
    _transaction: function (pid, lid, account, to, type, text, amount, currency, user, util) {
        /*
        #can user mfo.transaction in project: pid
        */
        if(!util.inside)
            return util.error('not allowed');

        var tryCreate = function() {
            var tid = Z.UUID.getRandom();
            db.get('transaction', tid, function (transaction) {
                if(transaction)
                    tryCreate();
                else{
                    db.add('transaction', {
                        uid: user._id,
                        createDate: new Date(),
                        pid: pid,
                        tid: tid,
                        aid: account.aid,
                        type: type,
                        comment: text,
                        currency: currency,
                        amount: amount,
                        status: 0,
                        account: to
                    }, function (err, data) {
                        console.log(err);
                        if(err)
                            return util.error('can not create');
                        else
                            util.ok(data.tid)
                    });
                }
            });
        };
        tryCreate();
        return util.wait;
    },
    proceed: function (tid, lid, user, util) {
        /*
        Proceed transaction or list of transactions
        #in#
          [tid]: transaction-id - id of transaction. optional if lid is specified
          [lid]: transaction-list-id - id of transaction list. optional if tid is specified. If both are specified - only single transaction with tid would be proceeded
        #ok
            {tid: transactionId, status: status}
         */
        if(!tid && !lid)
            return util.error('no tid or lid');
        if(tid) {
            db.get('transaction', tid, function (transaction) {
                if (!transaction)
                    return util.error('no transaction');
                util.inside = true;
                api.mfo._proceed({
                    pid: transaction.pid,
                    transaction: transaction,
                    util: util,
                    user: user
                });
            });
        }else if(lid){
            // TODO list logics
            return util.ok('list proceed is on maintenance');
        }
        return util.wait;
    },
    _proceed: function (pid, transaction, user, util) {
        /*
        #can user mfo.transaction in project: pid
        */

        if(!util.inside)
            return util.error('not allowed');

        console.log('aid',transaction);

        if(transaction.gateId)
            return util.error({tid: transaction.tid, status: 71, text: statusCodes[71].text});


        db.get('account', {aid: transaction.aid}, function (account) {
            if(!account)
                return util.error('no such account');
            console.log('inside proceed', account);
            var iface = interfaces[account.type];
            if (!iface) {
                return console.log('ERROR, no mfo `' + account.type + '`');
            }
            console.log(transaction);
            iface.transaction.call( account,
                account.bankid,
                account.bankpass,
                account.bankClient,
                account.currency,
                transaction.account,
                transaction.tid,
                transaction.type,
                transaction.currency,
                transaction.amount, function (data) {
                    console.log(data);
                if (data) {
                    db.edit('transaction', transaction.tid,{
                        status: data.status,
                        gateId: data.gateId
                    }, function (res) {
                        return util.ok({tid: transaction.tid, status: data.status});
                    });
                }else{
                    return util.error('try again');
                }
            });
        });

        return util.wait;
    },
    statusList: function () {
        /*
        Получить объект всех возможных статусов key - номер, value: описание
         */
        return statusCodes;
    },
    status: function (tid, user, util) {
        /*
        Получение статуса транзакции
            tid: transaction-id - id of transaction. optional if lid is specified


        #ok
            {tid: tid, status: status, text: text}

        #errors
            указан не существующий tid
            #error
                no transaction
         */
        if(!tid)
            return util.error('no tid');
        db.get('transaction', tid, function( transaction ) {
            if(!transaction)
                return util.error('no transaction');

            util.inside = true;
            api.mfo._status({
                transaction: transaction,
                pid: transaction.pid,
                util: util,
                user: user
            });
        });
        return util.wait;
    },
    _status: function (transaction, pid, user, util) {
        /*
        #can user mfo.transaction in project: pid
        */

        if(!util.inside)
            return util.error('not allowed');
        db.get('account', {aid: transaction.aid}, function (account) {
            if (!account)
                return util.error('no such account');
            console.log('inside proceed', account);
            var iface = interfaces[account.type];
            if (!iface) {
                return console.log('ERROR, no mfo `' + account.type + '`');
            }
            console.log(transaction);
            if(!transaction.gateId){
                transaction.status = 70;
                util.ok({tid: transaction.tid, status: transaction.status, text: statusCodes[transaction.status].text});
            }else if(transaction.status > 0) {
                util.ok({tid: transaction.tid, status: transaction.status, text: statusCodes[transaction.status].text});
                 iface.status.call(account,
                    account.bankid,
                    account.bankpass,
                    transaction.gateId,
                    function (data) {
                        if(data) {
                            db.edit('transaction', transaction.tid, {
                                status: data.status
                            });
                        }
                        console.log(data);
                    }
                );
            }else
                iface.status.call(account,
                    account.bankid,
                    account.bankpass,
                    transaction.gateId,
                    function (data) {
                        if(data) {
                            db.edit('transaction', transaction.tid,{
                                status: data.status
                            });
                            util.ok({
                                tid: transaction.tid,
                                status: data.status,
                                text: statusCodes[data.status].text
                            });
                        }else{
                            util.error(false);
                        }
                    }
                );
        });
        /*Z.doAfter(function (cb) {
            db.getList('status', 'tid', transaction.tid, function (list) {
                util.ok(list);
            });
        });*/
        return util.wait;

    },
    list: function (pid, user, util) {
        /*
        #can user mfo.balance in project: pid
        */

    }
};
/*
Z.query('mfo','transaction',{pid:'1b57b5aa69ad5326874cb768ad0017f1',aid: 2, amount: 1000, to: '4850780000603605'}, function(dat){
  console.log(dat.data);
  Z.query('mfo', 'proceed', {tid: dat.data});
})
 */