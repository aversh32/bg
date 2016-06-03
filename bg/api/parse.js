/**
 * Created by Ivan on 7/2/2015.
 */

module.exports = (function () {'use strict';
    var xmlParser = require('xml2js');
    var parseXML = function (data, cb) {
        if(!data)
            return cb(false);
        try {
            xmlParser.parseString(data, function (err, data) {
                if(err){
                    return cb(false);
                }
                cb(data);
            });
        }catch(e){
            return cb(false);
        }
    };
    return {
        xml: function (text, util) {
            parseXML(text, function (result) {
                if(result===false)
                    util.error('invalid xml');
                else
                    util.ok(result);
            });
            return util.wait;
        }
    };
})();

