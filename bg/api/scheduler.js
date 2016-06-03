/**
 * Created by Ivan on 12/29/2014.
 */
var moment = require('moment');
var db = Z.pg.use('schedule');
module.exports = {
    create: function( now, date, add, recurrent, recurrentAdd, recurrentSet, module, fn, data, user, util ){
        /*
            Schedule task. Worst accuracy is 2 minutes
            #in#
                module: text - module name
                fn: text - function name
                data: object - data for function
                [now]: date - current local date. Format: any that can be parsed by moment.js
                [date]: date - date of event. Format: any that can be parsed by moment.js
                [add]: object - format: {hour: 2, day: 1} - would mean that you want to make action in 2 hours and 1 day from 'date' if specified or 'server now' if not
                [recurrent=false]: bool - recurrent task
                [recurrentAdd]: object - format same as add, but it would add this to current time after run
                [recurrentSet]: object - works like add, but call `set` of moment js. !Remember, january is a zero month
         */
        try {
            if (now) {
                if (date) {
                    date = moment().add(moment(date).diff(now))
                }
            } else {
                if (date) {
                    date = moment(date);
                }
            }
            if (!date)
                date = moment();

            if (add)
                date.add(add);
        }catch(e){
            console.log(e);
            util.error('wrong format')
        }

        db.add('schedule', {
            createDate: new Date(),
            module: module,
            fn: fn,
            data: JSON.stringify(data),
            uid: user._id,
            nextDate: date.toDate(),
            recurrent: recurrent | 0,
            recurrentInfo: JSON.stringify({add: recurrentAdd, set: recurrentSet}),
            status: 0
        });

        return util.wait;
    },
    getMy: function (user, util) {
        db.get('schedule', 'uid', user._id, function (list) {
            util.ok(list);
        });
        return util.wait;
    }
};

var every = 60*1000,
    jobs = {};
var letsDO = function () {
    var before = new Date(new Date() + every);
    Z.doAfter(function (next) {


        db._low('SELECT * from schedule WHERE status=$1 and next_date < $2', [0, before], function (err, result) {
            console.log(err);
            if (err || !result.rows)
                next();
            result.rows
                .map(db._makeMapper('schedule'))
                .forEach(function (task) {
                    console.log(task)
                });
            next();
        });
    }, function () {
        setTimeout(letsDO, every);
    });
};
//setTimeout(letsDO, 2000);
