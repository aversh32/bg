/**
 * Created by Ivan on 8/31/2015.
 */
module.exports = {
    infobip: function (util, _body) {
        //console.log('cbib < ', _body);
        try {
            api.sms.statusCallback({data: _body});
            //util.ok('IT IS OK');
        }catch(e){
            console.log('error:callback status', e);
            util.error('Error');
        }
        return util.wait;
    },
    infobip2: function (util, _body) {
        console.log('cbib2 < ', _body);
    },
    '4pay': function(
        service_id, order_id, processing_status,
        error_сode, price, price_rub, currency,
        share, share_rub, transaction_date,
        transaction_id, hash, payment_method_id, util ){
        console.log(arguments);
        api.bill.cb({
            type: 'mc',
            g: '4pay',
            util: util,
            data: {
                service_id: service_id,
                order_id: order_id,
                processing_status: processing_status,
                error_сode: error_сode,
                price: price,
                price_rub: price_rub,
                currency: currency,
                share: share,
                share_rub: share_rub,
                transaction_date: transaction_date,
                transaction_id: transaction_id,
                hash: hash,
                payment_method_id: payment_method_id
            }
        });
    }
};