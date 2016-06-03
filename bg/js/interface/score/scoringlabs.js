/**
 * Created by Ivan on 8/13/2015.
 */
var Path = require('path');
var base = App.base;
var fs = require( 'fs' ),
    tpl = require(base+'/js/tpl'),
    curl = require('tinycurl');
var xmlParser = require('xml2js');
var xmlObj = function( xml, fn ){
    var _self = this;
    xmlParser.parseString(xml, function( err, data ){
        _self.data = data;
        fn.call(_self);
    });
};
tpl.loadAll(App.base + '/js/interface/score/scoringlabs');
var Phone = {
    sanitize: function( phone ){ // ocean phone format
        return Z.sanitize.phone( phone ).raw.substr(1);
    }
};
var moment = require('moment');
var pad2 = function (text) {
    return text < 10 ? '0'+text : text+'';

}
var dateFormatter = function( date ){
        var dat = date;
        return dat.getFullYear() + '-'+ pad2(dat.getMonth()+1) +'-' + pad2(dat.getDate());
    },
    dateTimeFormatter = function( date ){
        var dat = date;
        return dateFormatter( date ) + ' ' + dat.getHours() + ':' + ('0'+dat.getMinutes()).substr(-2)+ ':' + ('0'+dat.getSeconds()).substr(-2);
    };
var formatDate = function (date) {
    return dateTimeFormatter(date);
};
var sha1 = require('sha1');
module.exports = {
    person: function (data, cb) {
        var date = new Date();
        date.setMinutes(date.getMinutes()+date.getTimezoneOffset());
        date.setMilliseconds(0)
        console.log(date, date.getHours());
        var cfg = {
            ts: ((+date / 1000) - date.getTimezoneOffset() * 60).toFixed(1),
            product: '000126-0001-0001',
            secret: 'ChHya_8YrV"(SU84',//'*Tjb[\\BK[Z6#;$C6',
            password: '41LvJvJ7N9',// 'YbGaO2B1Ee',
            login: 'bg-neptun-prod'
        }//'bg-jupiter-prod'};

        console.log(cfg.secret+'-'+cfg.product+'-'+formatDate(date));
        cfg.hash = sha1(cfg.secret+'-'+cfg.product+'-'+dateTimeFormatter(date));
        Z.apply(data, cfg);

        var q = tpl.render('person', data);
        console.log('scoringlabs > ', q);
        curl.post('http://gw.scoringlabs.ru/check', {
                headers: [
                    'Content-type: text/xml; charset=utf-8'
                ],
                data: q
            }, function (err, data) {
                console.log('scoringlabs < ', data);
                ///console.log(data);
                xmlObj(data, function (res) {
                    cb(this.data);
                    //console.log(res);
                });
            }
        );
    }
};