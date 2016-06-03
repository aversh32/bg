/**
 * Created by Ivan on 6/26/2015.
 */

module.exports = (function () {
    var fns = {
        gt: '>',
        lt: '<',
        eq: '==',
        gte: '>=',
        ge: '>=',
        lte: '<=',
        le: '<=',
        ne: '!=',
        'exist': function (val) {
            return 'typeof ' + val + '!== \'undefined\'';
        },

        'exists': function (val) {
            console.log('exists',val);
            return 'typeof ' + val + '!== \'undefined\'';
        },
        'and': function (scope, val, soft) {
            return '(' + val.map(function (el) {
                    return makeFn(el, soft, scope, true);
                }).join(' && ') + ')';
        },
        'or': function (scope, val, soft) {
            console.log(arguments)
            return '(' + val.map(function (el) {
                    return makeFn(el, soft, scope, true);
                }).join(' || ') + ')';
        },
        'in': function () {

        },
        'nin': function () {

        }
    };
    var makeFn = function (obj, soft, scope, code) {
        soft = !!soft;
        scope = scope || 'el';
        var key, rules = [], val, type, subScope, fnName, fn1, res;
        for (key in obj)
            if (obj.hasOwnProperty(key)) {
                val = obj[key];
                subScope = scope + '[\'' + key + '\']';
                type = typeof val;
                if (key.charAt(0) === '$' && (fnName = key.substr(1)) && fnName in fns) {
                    fn1 = fns[fnName];
                    if (typeof fn1 === 'string') {
                        rules.push(scope + fn1 + JSON.stringify(val));
                    } else if (typeof fn1 === 'function') {
                        rules.push(fn1(scope, val, soft))
                    }
                } else if (type === 'number') {
                    rules.push(subScope + (soft ? '==' : '===') + val)
                } else if (type === 'string') {
                    rules.push(subScope + (soft ? '==' : '===') + JSON.stringify(val))
                } else if (type === 'object') {
                    res = makeFn(val, soft, subScope, true);
                    rules = rules.concat(res);
                }
            }
        var fn = 'return ' + rules.join('&&') + ';';
        //console.log(fn);
        try {
            return code ? rules : new Function('el', fn);
        }catch(e){
            return 'Error while compiling filter';
        }
    };
    return makeFn;
})();
