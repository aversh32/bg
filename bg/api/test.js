var cdb;

exports = module.exports = {
    testSum: function( a, b ){
        /*
        Функция возвращает сумму
        #in
            a: int
            b: int
        #out
            #ok
                {a:a,b:b,sum:a+b}
        */
        return {a:a,b:b,sum:-(-a-b)};
    },
    run: function( module, fn, util ){
        var base = App.base,
            mdl = require(base+'/ftest/'+module);
        util.ok(mdl[fn](util));
    },
    debug: function( user, util ){
        if( user._id !== 'USERNAME' )
            return false;
        util.stringify = function( data ){
            return JSON.stringify(data.data, null, 2);
        };
        util.ok(App.megalog);
        return util.wait;
    },
    clearDebug: function( user, util ){
        if( user._id !== 'USERNAME' )
            return false;

        util.ok(App.megalog);
        App.megalog = ['Start: '+new Date()];
        return util.wait;
    },
    curlLog: function( user, util ){
        cdb = cdb || Z.pg.use('curllog');
        cdb.getList( 'curllog', void 0, void 0, function( list ){
            return util.ok(list);
        });
        return util.wait;
    },
    testUser: function( user ){
        /*
        Функция возвращает логин авторизированного пользователя
        #out
            #ok
                login
        */
        return user.login;
    },
    err: function( util ){
        /*
        Функция возвращает ошибку
        #error
            Error
        */
        util.error('Error');
        return util.wait;
    },
    logging: function( util, _body, id, status ){
        console.green(['***', status, id, '***'].join(' '));
        console.green(_body);
        return true;
    },
    response: function( pid, type, data, util, user ){
        /*
        Функция для проверки оповещений
        #in
            pid: hash - project ID
            type: string - Тип оповещения
            data: object - Данные, которые съест шаблонизатор
        #out
            #ok
                {port, host, path, body, method}
        #can user response.manage in project: pid
         */
        api.response.send({pid: pid, type: type, data: data}, function(whatever){
            util.ok(whatever)
        });
        return util.wait;
    },
    long: function (time, util) {
        setTimeout(function () {
            util.ok('done');
        }, time);
        return util.wait;
    }
};