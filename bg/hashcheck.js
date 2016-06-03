/**
 * Created by Ivan on 12/22/2014.
 */
var crypto = require('crypto');
var vars = {
                //[
                    ownerId: 'GHJ45jhjg45hJHGJ',//TODO unique
                    agregatorId: 3,//TODO WTF
                //] unique
                phone: '9060758045',
                provider: 1,
                billTo: '6574898478', // TODO WTF. project.somebill

                merchantId: 'GHJ45jhjg45hJHGJ', //TODO WTF
                info: 'Мясо 2кг',
                amount: 1800,
                currency: 643
            };
var vars = {

};
/*
var t;
vars.hash =
                    crypto.createHash('md5').update(t=[
                    vars.ownerId,
                    vars.phone,
                    vars.provider,
                    vars.amount,
                    vars.currency,
                    vars.billTo,
                    vars.info,
                    'ghigg5765fugvj'
                ].join('') )
                .digest('base64');
*/
var iconv = require('iconv-lite');

vars.hash = crypto.createHash('md5').update(
    iconv.encode(
        '590aE0a677C140dc9ff380DD5Da9Aa019164819441210006436574898478Мясо тестовоеkuTku%yr$tgr)polkiuj',
        'win1251'
    )
).digest('base64');//'base64');

//console.log(t);
console.dir(vars);
console.log('need')
console.log('rysakiB3yRI4luKDo/1GKg==');