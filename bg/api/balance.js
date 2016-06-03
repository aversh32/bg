var balance, transaction;
var B = Z.pg.use('balance');

db.need('balance', function( storage ){
    balance = storage;
    if(storage.isNew){
        console.log('create balance hash');
       // storage.index('type');
        storage.index( 'owner' );
    }
    if( GLOBAL.createBG )
    storage.add({
        _id: 'THEWALLET',
        owner: 'MAINPROJ',
        access: {'MAINPROJ': true},
        createDate: +new Date(),
        name: 'MAINPROJ',
        amount: 0
    });
});
/*
{ _id: '1d6e5cc40e3884feb265c599d800fd08',
    _rev: '1-aaa5559494e80159c54247e6d8c933df',
    from: '4f0b8dc0d06d18f7440aa7d91405cb73',
    to: 'THEWALLET',
    amount: 0.6,
    date: [ 2014, 8, 11, 23, 3, 15, 869 ] },
 */
var creatorCache = {};
var getWCreator = function (wallets, cb) {
    var out = [],
        counter = wallets.length;
    wallets.forEach(function (wallet, i) {
        if(creatorCache[wallet.wid]){
            out[i] = creatorCache[wallet.wid];
            !(--counter) && cb(out);
        }else
            B.get('wallet', wallet.wid, function( w ) {
                out[i] = creatorCache[w.wid] = w.creator;
                !(--counter) && cb(out);
            });
    });
    //!counter && cb(out);
};

var migrateTransactions = function(  ){
    transaction.getAll('from', function( list ){

        var g = 0;
        var errFn = function( err, result ){
            g++;
            g%10===0 && console.log(g);
            g%100 === 0 && App.megalog.push({tr_im:[g, _i]});
            if( err ){
                console.log(err)
            }
            if( g === _i){
                console.green( 'finished transactions' );

            }
        };
        for( var i = 0, _i = list.length; i < _i; i++ ){
            var item = list[i];

            B.add( 'transaction', {
                from: item.from,
                to: item.to,
                createDate: item.date && item.date.length && Z.getDateFromArray(item.date) || new Date(),
                amount: item.amount*100,
                currency: 0,
                type: item.to === 'THEWALLET' ? 1 : 2
            }, errFn );

        }
    })
};
var migrate = function(  ){

    balance.getAll('owner', function( list ){
        var g = 0;
        var errFn = function( err, result ){
            g++;
            g%20===0 && console.log(g);
            if( err ){
                console.log(err)
            }
            if( g === _i*2){
                console.green( 'finished wallets' );
                migrateTransactions();
            }
        };
        for( var i = 0, _i = list.length; i < _i; i++ ){
            var item = list[i];
            if( !item.owner ){
                g+=2;
                console.dir( item );
            }else{
                B.add( 'wallet', {
                    wid: item._id,
                    creator: item.owner,
                    createDate: new Date( item.createDate )
                }, errFn );
                B.add('balance', {
                    wid: item._id,
                    currency: 0,
                    amount: item.amount*100
                }, errFn);
                api.access.grant({
                    uid: item.owner,
                    iid: item._id,
                    type: 'wallet',
                    role: 'wallet'
                });
            }
            /*
    { _id: 'f2a2edb0cbc44ec33d5a8de13e0040eb',
    _rev: '1-a1d06cdce43001c553fb99d30e95819e',
    access: { f2a2edb0cbc44ec33d5a8de13e003d83: true },
    createDate: 1412947011474,
    amount: 0,
    transactions: [],
    blocked: false,
    owner: 'f2a2edb0cbc44ec33d5a8de13e003d83' },

             */

        }
        //console.log(list);
    });
};
db.need('transaction', function( storage ){
    transaction = storage;
    if(storage.isNew){
        console.log('create transaction hash');
        transaction.index(['from', 'to']);
    }
    /*setTimeout( function(  ){
        B._low('SELECT count(tid) FROM transaction;',[], function(err, result){

            if(result.rows[0].count == 0 ){
                migrate();
                console.green('migrate transactions to postgresql');
            }
        })
    }, 5000);*/


});
var typeMap = {
    terasms: 1,
    income: 2,
    ruru: 3,
    'paystream-premium': 4
};
exports = module.exports = {
    create: function( owner, amount, util, closed ){
        if( !util.internal )
            return false;
        var createWallet = function(  ){
            var wid = Z.UUID.getRandom();
            B.get('wallet', wid, function( w ){
                if( w ) // already exists
                    createWallet();
                else{
                    Z.doAfter( function( cb ){
                        B.add( 'wallet', {
                            wid: wid,
                            creator: owner,
                            createDate: new Date()
                        }, cb );
                    }, function( cb ){
                        B.add('balance', {
                            wid: wid,
                            currency: 0,
                            amount: amount || 0
                        }, cb);
                    }, function(  ){
                        util.ok(wid);
                    });
                    api.access.grant({
                        uid: owner,
                        iid: wid,
                        type: 'wallet',
                        role: 'wallet'
                    });
                }
            });
        };
        createWallet();
        return util.wait;
    },
    transaction: function(
            id, amount, to, minus, type, currency,

            user, util
        ){
        type = typeMap[type];
        type === void 0 && (type = 2);
        amount = Math.floor(amount * 100);
        currency = currency || 0;
        minus = minus || 0;
        if( !util.internal )
            minus = 0;
        //console.log(arguments);
        if( !util.internal && user._id !== 'USERNAME' )
            return false;
        var walletFrom, walletTo, balanceFrom, balanceTo,
            walletCheck = function(){
                B.get( 'wallet', id, function( instance ){
                    if( instance && !instance.blocked && (instance.creator === user._id || 'USERNAME' === user._id) && amount > 0 ){
                        if( instance.wid === 'THEWALLET' )
                            minus = amount;
                        amountCheck();
                        walletFrom = instance;
                    }else
                        util.error();
                });
            },
            amountCheck = function(){
                B.get('balance', {wid: id, currency: currency}, function( instance ){
                    if( instance && instance.amount + minus >= amount ){
                        balanceFrom = instance;
                        toWalletCheck();
                    }else{
                        util.error('notEnoughMoney');
                    }
                });
            },
            toWalletCheck = function(){
                B.get( 'wallet', to, function( instance ){
                    if( instance && !instance.blocked ){
                        walletTo = instance;
                        toBalanceCheck();
                    }else{
                        util.error( 'blocked' )
                    }
                });
            },
            toBalanceCheck = function(){
                B.get('balance', {wid: to, currency: currency}, function( instance ){
                    if( instance ){
                        balanceTo = instance;
                        B.add('transaction', {
                            from: id,
                            to: to,
                            amount: amount,
                            currency: currency,
                            createDate: new Date(),
                            type: type
                        }, function( err, result ){
                            var tid = result.tid;
                            var q,
                                data;
                                if( id !== 'THEWALLET' ){
                                    q = 'UPDATE balance set amount=amount-$1 where "wid"=$2 and "currency"=$3;';
                                    data = [amount, id, currency];
                                    B._low(q, data, function( err, result ){

                                    });
                                }
                                q = 'UPDATE balance set amount=amount+$1 where "wid"=$2 and "currency"=$3;';
                                data = [amount, to, currency];
                                B._low(q, data, function( err, result ){
                                    var finalCount = (balanceFrom.amount-amount)/100;

                                    if (amount < 0)
                                        api.balance.notification({
                                            walletTo: balanceTo,
                                            walletFrom: balanceFrom,
                                            currency: currency,
                                            diff: -amount
                                        });

                                    else if (amount > 0)
                                        api.balance.notification({
                                            walletTo: balanceFrom,
                                            walletFrom: balanceTo,
                                            currency: currency,
                                            diff: amount
                                        });

                                    util.ok(finalCount)
                                });


                        });
                    }else{
                        util.error('No to wallet');
                    }

                });
            };

        walletCheck();
        return util.wait;
    },
    notification: function( walletTo, walletFrom, currency, diff, util, user ){
        /*
        Не делать из каждого сообщения источник эвентов, пусть это будет событие рассылки.
         */
        console.log('w1', walletFrom, walletTo)
        getWCreator([walletFrom,walletTo], function (res) {
            res[0] && api.gear.rotate({
                iid: res[0],
                type: 'project',
                event: 'balanceChange',
                data: (walletFrom.amount-diff)/100
            });
            res[1] && api.gear.rotate({
                iid: res[1],
                type: 'project',
                event: 'balanceChange',
                data: (walletTo.amount+diff)/100
            });
        });

        /*return;
        currency = currency || 0;
        var theUser = App.setSecurityFlag({_id: 'USERNAME'});

        B.get('wallet', walletFrom.wid, function( w ){
            if( !w )
                return;
            api.gear.rotate({
                iid: walletFrom.creator,
                type: 'project',
                event: 'balanceChange',
                data: (walletFrom.amount-diff)/100
            });
            api.project.get({id: w.creator, user: theUser},function(proj){
                if( proj ){
                    var credit = proj.credit || 400;
                    var val1 = walletFrom.amount/100,
                        val2 = (walletFrom.amount-diff)/100;
                    if( val1 > credit && val2 < credit ){
                        api.response.send({
                            pid: w.creator,
                            type: 'project.balanceNotify',
                            data: {
                                value: val2,
                                valueOld: val1,
                                project: proj.name,
                                id: proj.id
                            }
                        });
                    }
                }

            });
        });
        B.get('wallet', walletTo.wid, function( w ){
            if( !w )
                return;
            api.project.get({id: w.creator, user: theUser},function(proj){
                if( proj ){
                    var credit = proj.credit || 400;
                    var val1 = walletTo.amount/100,
                        val2 = (walletTo.amount+diff)/100;
                    if( val1 > credit && val2 < credit ){
                        api.response.send({
                            pid: w.creator,
                            type: 'project.balanceNotify',
                            data: {
                                value: val2,
                                valueOld: val1,
                                project: proj.name,
                                id: proj.id
                            }
                        });
                    }
                }

            });
        });*/


    },
    info: function( pid, data, user, util ){
        /*

         */

        /*balance.get( 'owner', pid, function( instance ){
            if( !instance )
                return util.error('noWallet');
            var res = [];
            data[1] += 1000*60*60*24;
            Z.doAfter( function(callback){
                transaction.getList('to', instance._id, function( list ){

                    list.filter( function( el ){
                        var d = +Z.getDateFromArray(el.date);
                        el.d = d;
                        return d >= data[0] && d < data[1];
                    } ).forEach( function( el ){
                        res.push( {type: 'to', date: el.d, amount: el.amount} );
                    });
                    callback();
                });
            }, function( callback ){
                transaction.getList('from', instance._id, function( list ){

                    list.filter( function( el ){
                        var d = +Z.getDateFromArray(el.date);
                        el.d = d;
                        return d >= data[0] && d < data[1];
                    } ).forEach( function( el ){
                        res.push( {type: 'from', date: el.d, amount: el.amount} );
                    });
                    callback();
                });
            },function(){
                util.ok(res);
            })

        });*/
        return util.wait
    },
    /*remove: function( user, id, util, closed ){
        balance.get( id, function( instance ){
            if( instance && instance.creator === user._id ){
                balance.remove(id, instance._rev);
                util.ok();
            }else
                util.error();
        });
        return util.wait;
    },*/
    get: function( user, util, owner, from, closed ){
        if( !util.internal && !user._id === 'USERNAME')
            return false;
        //App.megalog.push({getBalance:owner});
        B.get('wallet', {creator: owner}, function( instance ){
            //App.megalog.push({getBalance:owner, i: instance});
            //console.dir(instance)
            if( instance ){
                var res = {id: instance.wid, _id: instance.wid };
                B.get('balance', {wid: instance.wid, currency: 0}, function( balance ){
                    if( balance ){
                       //App.megalog.push( {getBalance: owner, b: balance} );
                        res.amount = balance.amount / 100;
                        util.ok( res );
                    }else{
                        B.add('balance', {
                            wid: instance.wid,
                            currency: 0,
                            amount: 0
                        });
                        res.amount = 0;
                        util.ok(res);
                    }
                })
            }else{
                api.balance.create({owner:owner,amount:0}, function(  ){
                    util._recall()();
                });
                //util.error('noWallet');
            }
        });
        return util.wait;
    }/*,
    list: function( user, owner, util ){
        if( owner !== user._id)
            return false;
        balance.getList('creator', owner,function( list ){
            util.ok( list.map( function( el ){
                el.id = el._id;
                delete el._id;
                return el;
            }) );
        });
        return util.wait;
    }*/
};