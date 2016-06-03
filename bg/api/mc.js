/*var iconv = new require('iconv').Iconv('UTF-8', 'CP1251');*/
/*
 var crypto = require('crypto' ),
 order = ['action','id','externalId', 'code', 'account', 'amount', 'date', 'params'],
 hmac = function( data, key ){
 var text = '', item;
 for( var i = 0, _i = order.length; i < _i; i++ ){
 item = order[i];
 item in data && (text+=data[item]);
 }
 var result = crypto.createHmac('sha1', key).update(text).digest('base64');
 console.log(text);
 console.log(result);
 return result;
 },
 buildUrl = function( url, data, key ){
 var item, tokens = [];
 for( var i = 0, _i = order.length; i < _i; i++ ){
 item = order[i];
 item in data && tokens.push(item+'='+encodeURIComponent(data[item]));
 }
 tokens.push('signature='+hmac(data, key));
 return url +'?'+ tokens.join('&');

 };


 var data = iconv.convert('55010012243574http://site.ru/successhttp://site.ru/fail').toString();

 console.log(crypto.createHmac('sha1',
 new Buffer(iconv.convert('Z2FtZUJib21NbWJiejc4MzBrdjc1cw==').toString(), 'base64').toString('binary')
 ).update(data,'CP1251').digest('base64'));
 console.log('wNuMs++v6maXJSG1uUL1JVRTl2k=');*/
//https://178.20.234.188/RuRu.FrontEnd.ServiceProvider/TransactionService.svc
module.exports = {
    bill: function( pid, phone, cost ){

        var url = 'https://demo.ruru.ru/';
        var data = {
            action: 'init',
            id: 232456456,
            externalId: 12345,
            code: 55,
            account: 9031100000,
            amount: 50000,
            date: '2012-03-02 22:12:13',
            params: 'pname pvalue;'
        };
        return buildUrl( url, data, 'DjnQ8jSocJmiSd0Nyfiq9QerjFE=');



        //signature=DjnQ8jSocJmiSd0Nyfiq9QerjFE=
    }
};