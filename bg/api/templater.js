exports = module.exports = {
    template: function( tpl, obj ){
        obj = obj || {};
        for( var i = 0; i < 3; i++) // TODO remove dirty hack
            tpl = tpl.replace(/{([^{]*?)}/g,function(full, expr){
                if(expr.indexOf('?')>-1){
                    var tokens = expr.split('?'),
                        test = tokens[0].split('='),
                        values = tokens[1].split(':');
                    if(obj[test[0]]===test[1])
                        return values[0] || '';
                    else
                        return values[1] || '';
                }else
                    return obj[expr] || '';

            });
        return tpl;
    }
};
/*
var obj = {name: 'vasilij', sex: 'female'};

var tpl = 'Уважаем{sex=male?ый:{sex=female?ая:ый\\ая}} {name}! Мы вас ебали.';           #bg-fun
Z.query('templater','template', {obj: obj, tpl: tpl}, function(data){
    console.log(data.data);
})*/
