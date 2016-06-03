var greater,
    lower,
    greaterEqual,
    lowerEqual,
    equal,
    contains,
    conditions = {
        greater: greater = function(prop, varName){
            return prop +'>'+ varName;
        },
        'greater-equal': greaterEqual = function(prop, varName){
            return prop +'>='+ varName;
        },
        lower: lower = function(prop, varName){
            return prop +'<'+ varName;
        },
        'lower-equal': lowerEqual = function(prop, varName){
            return prop +'<='+ varName;
        },
        equal: equal = function(prop, varName){
            return prop +'==='+ varName;
        },
        contains: contains = function(prop, varName){
            return prop +'.indexOf('+ varName+')>-1';
        },
        startWith: function( prop, varName ){
            return prop +'.indexOf('+ varName+')===0';
        },
        endWith: function( prop, varName, opt, data ){
            return prop +'.substr(-'+ data.length +')==='+ varName;
        },
        '>': greater,
        'gt': greater,
        
        '<': lower,
        'lt': lower,
        
        '<=': lowerEqual,
        'le': lowerEqual,
        
        '>=': greaterEqual,
        'ge': greaterEqual
        
        
    }, 
    replaces = {
        '>=': '_ge_',
        '<=': '_le_',
        '>': '_gt_',
        '<': '_lt_',
        '==': '_eq1_',
        '===': '_eq2_'
    },
    rawReplaces = [], i,
    replaceRegExp,
    replaceFn = function( p ){
        return replaces[p];
    };
    for( i in replaces )
        replaces.hasOwnProperty(i) && 
            rawReplaces.push( i );
    rawReplaces = rawReplaces.join( '|' );
    replaceRegExp = new RegExp('('+rawReplaces+')', 'g');
Z.matcher = function( cfg ){
    var txt = [],
        params = [],
        i, j, prop, val, subCondition, condition, op1, op2, mod;
    for( i in cfg )
        if( cfg.hasOwnProperty(i) ){
            prop = cfg[i];
            if(typeof prop !== 'object'){
                cfg[i] = prop = {equal: prop}

            }
            subCondition = [];
            for( j in prop) if(prop.hasOwnProperty(j)){
                condition = j.split(':')[0];
                val = prop[condition];

                op1 = 'obj[\''+ i +'\']';
                op2 = ('p_'+ i +'_'+ condition).replace( replaceRegExp, replaceFn );

                params.push(op2 +'=cfg[\''+i+'\'][\''+ j +'\']');

                mod = j.split(':')[1]||'';
                if( mod.indexOf('i')>-1 ){
                    params.push(op2 +'_i=(('+ op2 +'||\'\')+\'\').toLowerCase()');
                    op2 += '_i';
                    op1 = '(('+op1+'||\'\')+\'\').toLowerCase()';
                }

                subCondition.push(conditions[condition](
                    op1,
                    op2,
                    mod,
                    prop[condition]

                ))
            }

            txt.push( '('+subCondition.join('&&')+')');

        }
//              console.log(params);
    var fin = 'var '+params.join(',')+';\nreturn function(obj){'+'return ('+ txt.join(' &&\n\t ')+ ');'+'\n};';
//console.log(fin)
    return (new Function('cfg', fin))(cfg);
};
module.exports = Z;