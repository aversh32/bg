var xmlParser = require('xml2js');
var xml = '<?xml version=\'1.0\' encoding=\'UTF-8\'?>'+
'<soap:Envelope xmlns:soap="http://www.w3.org/2003/05/soap-envelope">'+
'  <soap:Body>'+
'    <ns1:MCRegistReq xmlns:ns1="http://mobicom.oceanbank.ru/xsd" ns1:version="1.0" ns1:hash="gNZXU4WT76lNM6KebdC42w==">'+
'      <ns1:Agregator>'+
'        <ns1:id>1</ns1:id>'+
'      </ns1:Agregator>'+
'      <ns1:Merchant>'+
'        <ns1:id>1</ns1:id>'+
'      </ns1:Merchant>'+
'      <ns1:Owner>'+
'        <ns1:id>GHJ45jhjg45hJHGJ</ns1:id>'+
'      </ns1:Owner>'+
'      <ns1:Client>'+
'        <ns1:Phone>'+
'          <ns1:number>9060758045</ns1:number>'+
'        </ns1:Phone>'+
'      </ns1:Client>'+
'      <ns1:Payment>'+
'        <ns1:amount>2800</ns1:amount>'+
'        <ns1:abonentFee>300</ns1:abonentFee>'+
'        <ns1:currency>643</ns1:currency>'+
'        <ns1:result>15</ns1:result>'+
'      </ns1:Payment>'+
'      <ns1:Transaction>'+
'        <ns1:id>840639BB3582A8A626AA691BA2775341</ns1:id>'+
'      </ns1:Transaction>'+
'    </ns1:MCRegistReq>'+
'  </soap:Body>'+
'</soap:Envelope>';
var xmlObj = function( xml, fn ){
    var _self = this;
    xmlParser.parseString(xml, function( err, data ){
        _self.data = data;
        fn.call(_self);
    });
};
xmlObj.prototype = {
    get: function( text ){
        var tokens = text.split('.' ),
            data = [this.data],
            match,
            item,
            el, i, _i, j;
        debugger;
        while(el = tokens.shift()){
            match = [];
            for( i = 0, _i = data.length; i < _i; i++ ){
                item = data[i];
                if( typeof item === 'object' )
                for( j in item )
                    if(item.hasOwnProperty(j)){
                        if( j.indexOf(':') > -1 && el === j.split(':')[1]){

                            match.push(item[j]);
                            break;
                        }else{
                             data.push(item[j]);
                            _i++;
                        }
                    }
                if(match.length) break;
            }
            if(match.length){
                data = match;

            }
            console.log(match, data)
        }
        return match;
    },
    get2: function( text ){
        var regExp = new RegExp(text.replace(/\./g,'\\.(.*?\\.)?'));
    }
};
/*var x = new xmlObj(xml, function(){
    var d = +new Date();
    console.log(this.get('Body.Agregator.id')[0][0]);
    for(var i = 0; i < 1000;i++)
    this.get('Body.id')

    console.log(+new Date()-d);
});*/
new xmlObj('<?xml version="1.0" encoding="utf-8"?>\n'+
'<response><code>000</code><transaction>3165</transaction><rules></rules><entities><entity><properties><property><name>score</name><value>61</value></property><property><name>description</name><value>Проверяемый идентифицирован системой</value></property><property><name>description</name><value>Подтверждены сведения о принадлежности проверяемому указанного в заявке паспорта</value></property><property><name>description</name><value>Подтверждена платежеспособность проверяемого 2 года назад или ранее: приобретение товаров не первой необходимости</value></property></properties></entity></entities><score>0</score><date>2015-08-17T11:07:36+00:00</date><message>OK</message></response>',
    function(a,b){
        console.log(a,b, this.data.response, '|',this.get('code'))
    }
);