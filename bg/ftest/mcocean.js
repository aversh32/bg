/**
 * Created by Ivan on 12/23/2014.
 */
var base = App.base,

    tpl = require(base+'/js/tpl');

tpl.loadAll(base+'/js/interface/mc/oceanTpl/');

module.exports = {
    cbok: function(util){
        api.bill.cb({
            type: 'mc',
            g:'ocean',
            _body: tpl.render('MCRegistReq', {}),
            util: util
        }, function(a,b){
            console.log(a);
            console.log(b);
        });
    }
}