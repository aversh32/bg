/**
 * Created by Ivan on 11/25/2014.
 */
var db = Z.pg.use('paystreampremium' ),
    sanitizer = Z.sanitize({
        cost: function( el ){
            if(el <= 0)
                throw('LEQ0');
            return el;
        },
        items: {
            fn: function( el ){
                if( el.length > 10 )
                    throw('length');
            },
            item: function(){

            }
        }
    });

var paystream = module.exports = {
    bill: function( cfg, util, callback ){
        
    },
    cb: function( cfg, util, callback ){
        // parse projects
        // create bill here.
        var tokens = util.response.req.headers['x-original-url'].split('?');
        tokens.shift();

        var data = tokens.join('?')
            .replace(/^\?/,'')
            .split('&')
            .reduce(function(a,b){
                var tokens = b.split('=');
                a[decodeURIComponent(tokens[0])] = decodeURIComponent(tokens[1]);
                return a;
            },{});
        App.megalog.push({psIncome:[data]});
        data = sanitizer(data);
        //db.add(data);
        /*api.bill.create({
            payer:payer, pid: pid, amount: amount
        });*/

    }
};

//test
paystream.test = function(  ){
    setTimeout( function(  ){
        paystream.cb({}, {
            response: {
                req: {
                    headers: {
                        'x-original-url': 'agaga?msg=trol&trol&date=2014-12-02%2009:39:20&operator=mts&operator_id=1&user_id=79164819441&smsid=1&cost=20&currency=1&abonent_cost=40&abonent_currency=1&num=6666&country_id=7'
                    }
                }
            }
        });
    }, 4000);
};
//paystream.test();

