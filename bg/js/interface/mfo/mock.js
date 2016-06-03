/**
 * Created by Ivan on 6/15/2015.
 */
function valid_credit_card(value) {
    // accept only digits, dashes or spaces
    if (/[^0-9-\s]+/.test(value)) return false;

    // The Luhn Algorithm. It's so pretty.
    var nCheck = 0, nDigit = 0, bEven = false;
    value = value.replace(/\D/g, "");

    for (var n = value.length - 1; n >= 0; n--) {
        var cDigit = value.charAt(n),
            nDigit = parseInt(cDigit, 10);

        if (bEven) {
            if ((nDigit *= 2) > 9) nDigit -= 9;
        }

        nCheck += nDigit;
        bEven = !bEven;
    }

    return (nCheck % 10) == 0;
}
var db = Z.pg.use('mfo');
exports = module.exports = (function(){ 'use strict';
    return {
        balance: function (login, pass, cb) {
            setTimeout(function () {
                cb({643: {balance: 10000}});
            },10);
        },
        info: function (id, pass, account, currencyFrom, to, type, currencyTo, amount, cb) {
            setTimeout(function () {
                var o = {
                    amount: amount,
                    full: amount*1.1,
                    fix:100,
                    percent: 1,
                    min: 1000,
                    max: 100000

                };
                o.price = o.full - o.amount;
                cb(o);
            },10);
        },
        transaction: function (id, pass, account, currencyFrom, to, tid, type, currencyTo, amount, cb) {
            db.add('test_mfo', {
                tid: id,
                aid: account.aid,
                pid: account.pid,
                amount: amount,
                currency: currencyFrom,
                account: to
            }, function (g) {
                console.log(g);
                var out = {tid: id, gateId: id};
                setTimeout(function () {
                    if( !valid_credit_card(to) )
                        out.status = 30;
                    else if(amount<1000)
                        out.status = 21;
                    else if(amount>1500000)
                        out.status = 22;
                    else
                        out.status = 0;

                    db.edit('test_mfo', id, {
                        status: out.status
                    }, function () {
                        cb(out);
                    });


                },10);
            });
        },
        status: function (id, pass, tid, cb) {
            db.get('test_mfo', {tid: id}, function (t) {
                //if(!t)
                var out = {tid: id, status: t.status};
                setTimeout(function () {
                    if(t.status>0)
                        out.status = t.status;
                    else {
                        out.status--;
                        if(out.status < (-(Math.random()*3))){
                            if(out.status = t.account.substr(-1)==='4')
                                out.status = 20;
                            else
                                out.status = 10;
                        }
                    }
                    db.edit('test_mfo', id, {
                        status: out.status
                    });

                    if(out.status<0)out.status = 0;
                    cb(out);
                },10);

            });
        }
    };
})();