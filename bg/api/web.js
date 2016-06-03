var menu = {
    profile: {icon:'big-options', text: 'Профиль' },
    stats: {icon:'big-stat', text: 'Статистика'},
    payout: {icon:'big-wallet', text: 'Выплаты'},
    projects: {icon:'big-box', text: 'Проекты'},
    companies: {icon:'big-briefcase', text: 'Компании'},
    buh: {icon:'mini-company', text: 'Бухгалтерия'},
    contacts: {icon:'mini-company', text: 'Контакты'},
    collaboration: {icon:'big-stat', text: 'Обращения'}
};
Z.each(menu, function(key, val){
    val.id = key;
});

var fastWrap = function( name ){
    return function(user){

        var context = new Context({
            user: user,
            wFactory: w.factory()
        });

        var out = {content: vm[name](context)};
        out.js = context.wFactory.js;
        return out;
    }
};
var os = require('os');
exports = module.exports = {
    ping: function(){
        return 'pong';
    },
    stats: function(  ){
        return {
            memory: process.memoryUsage(),
            freeMemory: os.freemem(),
            totalMemory: os.totalmem(),
            uptime: process.uptime(),
            osUptime: os.uptime(),
            cpu: os.cpus()
        };
    },
    //profile: fastWrap('profile'),
    //stats: fastWrap('stats'),
    //payout: fastWrap('payout'),
    //projects: fastWrap('projects'),
    //contacts: fastWrap('contacts'),
    getTpls: function( name ){

        name = Z.makeArray(name);
        var widgets = w.factory();
        var ok = true,
            subOk;
        name.forEach( function( name ){
            subOk = widgets.exportTpl(name) !== false
            ok = ok && subOk;
            if(!subOk)
                console.log('Error loading template', name);
        });

        return ok ? widgets.js : false;
    },
    getMenu: function( items ){

        var out = items.map( function( el ){

            return menu[el];
        });
        out.splice(out.length - 1,0,'-');
        return out;
        /*[{id:'profile', icon:'big-options', text: 'Профиль'},
        {id:'projects', icon:'big-box', text: 'Статистика', count: 66},
        {id:'stats', icon:'big-stat', text: 'Выплаты'},
        //{id:'company', icon:'big-wallet', text: 'Компании'},
        {id:'company', icon:'mini-company', text: 'Бухгалтерия'},
        '-',
        {id:'buh', icon:'big-briefcase', text: 'Проекты'}]*/
    }
};