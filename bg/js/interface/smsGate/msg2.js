/**
 * Created by Ivan on 6/26/2015.
 */
exports = module.exports = (function() {
    'use strict';
    var fs = require('fs'),
        tpl = require(App.base + '/js/tpl'),
        curl = require('tinycurl');
    var md5 = require('md5');
    var xmlParser = require('xml2js');

    tpl.loadAll(App.base + '/js/interface/smsGate/msg2');
    var parseXML = function (data, cb) {
        if (!data)
            return cb(false);
        try {
            xmlParser.parseString(data, function (err, data) {
                if (err) {
                    return cb(false);
                }
                cb(data);
            });
        } catch (e) {
            return cb(false);
        }
    };
    //http://gw.msg2.ru/msgapi
    return {
        normalSend: function (from, data, callback) {
            var i, _i, lastText, text,
                different = false,
                hash = Z.makeHash(data,'phone');

            for( i = 0, _i = data.length; i < _i; i++ ){
                text = data[i].text;
                if( i > 0 && lastText !== text ){
                    different = true;
                    break;
                }
                lastText = text;
            }
            var mnu = this;
            this.interface.send.call(
                this,
                data,
                'sender' in this ? this.sender : from,
                different, function(err, body){
                    if(!body){
                        setTimeout( function(  ){
                            this.interface.normalSend.call(this, from, data, callback);
                        }.bind(mnu), 1000);
                        return;
                    }
                    console.log(body);
                    //callback(err, data);


                });
        },
        send: function (data, sender, different, callback) {
            callback = callback || different;
            if (typeof callback !== 'function')
                callback = function () {
                };

            var list = data.map(function (el) {
                return el.phone + ':' + el.text.replace(/\n/g, '\\n');
            }).join('\n');
            var item = data[0];
            var hash = this.secret+'-700-'+this.aid;
            console.log('MD5('+hash+') = '+ md5(hash));
            var q = tpl.render('send', {
                aid: this.aid,
                method: this.MethodID,
                phone: item.phone,
                text: item.text,
                hash: md5(hash)
            });
            console.log('msg2 > ', q);
            curl.post('http://gw.msg2.ru/msgapi', {
                    headers: [
                        'Content-type: text/xml; charset=utf-8'
                    ],
                    data: q
                }, function (err, data) {
                    console.log('msg2 < ', data);
                    //console.log(data);
                    parseXML(data, function (res) {
                        console.log(res);
                    });
                }
            );
        },
        status: function( id, callback ){

        }
    };
})();