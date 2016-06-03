var crypto = require( 'crypto' );
var hashFromString = function( text ){
    var hash = crypto.createHash('sha256');
    hash.update(text);
    return hash.digest('base64')
};
App.realUser = function (id) {
    if(typeof id === 'object') {
        if (id.realUser instanceof App.realUser) {
            return id.realUser.id;
        }else{
            return false;
        }
    }else{
        this.id = id;
    }
};
var setSecurityFlag = App.setSecurityFlag = function (user) {
    if(!user.realUser)
        Object.defineProperty(user, 'realUser', {
            enumerable: false,
            configurable: false,
            writable: false,
            value: new App.realUser(user._id || user.id)
        });
    return user;
};
var store;
db.need('user', function( storage ){
    store = storage;
    if(storage.isNew){
        storage.index(['login','session','phone', 'email']);
        console.log('create session hash');
        storage.index(['login','session','phone','email'], function(  ){
            console.log('add test user');
            storage.add({
                login: 'test1@mi.mi',
                password: hashFromString('test2'),
                name: 'Тестовый',
                surname: 'Юзер',
                email: 'test1@mi.mi',
                session: 'wIwhPVCqxExy8drpuKW1QWdTzETEKazh9F2OXy0Rirk='
            });

        });

    }

    if( GLOBAL.createBG )
        storage.add({
            _id: 'USERNAME',
            login: 'BILLINGRAD@BILLINGRAD.COM',
            password: hashFromString('ERHJTHJ^$%U&O$^%&I*O'),
            name: 'BILLINGRAD',
            surname: 'BILLINGRAD',
            email: 'BILLINGRAD@BILLINGRAD.COM',
            session: 'wIwhPVCqxExy8drpuKW1QWdTzETEKazh9F2OXy0sirk='
        }, function(){

        });
});
exports = module.exports = {
    find: function (name, util) {
        name = name.toLowerCase();
        store.getAll('phone', function( list ){
            util.ok( list.filter( function( el ){
                if((el.name+'').toLowerCase().indexOf(name)>-1||
                    (el.login+'').toLowerCase().indexOf(name)>-1||
                    (el.email+'').toLowerCase().indexOf(name)>-1) {
                        delete el.session;
                        delete el.password;
                        delete el.agree;
                        delete el.group;
                        delete el._rev;
                    setSecurityFlag(el);
                        return true;
                }
                return false;
            } ).filter( function( el ){
                return !el.removed;
            }).filter( function( el,i ){
                return i < 10;
            }) );
        });
        return util.wait;
    },
    getAll: function( util, user ){
        /*
        #can user user.list in system: billingrad
        */

        store.getAll('phone', function( list ){
            util.ok( list.map( function( el ){
                delete el.session;
                delete el.password;
                delete el._rev;
                setSecurityFlag(el);
                return el;
            } ).filter( function( el ){
                    return !el.removed;
            }) );
        });


        return util.wait;
    },
    _login: function( login, password, util ){

        store.get('login', login, function( user ){
          //  console.log(user)
            if(user){
                //console.log(user.pasword,hashFromString(password))
                if( util.internal || user.password === hashFromString(password) ){

                    user.session = user.session || hashFromString(user.login+user.password + Math.random().toString(26));
                    store.edit(user, function(  ){
                        util.ok(user.session);
                    });
                    return;
                }else{

                    return util.error('wrongPassword');
                }
            }
            util.error('wrong');
        });
        return util.wait;
    },
    register: function( data, util ){
        /*
        Регистрация нового пользователя
        #in
            data
                login: email || phone - Логин нового пользователя
                password: password - Пароль
        #out
            Proxy data.login, data.password to <login>( login, password )
            #errors
                Логин уже существует
                #error
                    loginExists
         */
        if( data && data.login ){
            var pass = data.password = data.password || Z.UUID.someRandom();
            data.password = hashFromString(data.password);
            if( data.login.indexOf('@') > 1 ){
                data.email = data.login;
            }else{
                if(Z.validate.phone(data.login)){
                    data.login = data.phone = Z.sanitize.phone(data.login).raw;
                }else{
                    return util.error('incorrectLogin');
                }
            }
            var result = function( user ){
                if(user){
                    util.error('loginExists');
                }else{
					data.phone = "";
                    data.doubleAuthorize = true;
                    data.createDate = +new Date();
                    delete data.util;
                    store.add(data, function( err, res ){
                        console.dir(data);
                        console.dir(err)
                        api.project.create({
                            user: {_id: res.id},
                            data: {
                                name: 'Мой первый проект'/*,
                                fullName: 'Проект'*/
                            },
                            first: true
                        });
                        api.authorize.login( {
                            login:data.phone||data.email,
                            password: pass,
                            util: util
                        } );
                        App.email.send({
                           text:    "Дорогие следящие за регистрацией пользователей, у нас пополнение!\n" +
                               'Зарегистрировался «'+(data.phone||data.email)+'»',
                           from:    "BILLINGRAD <register@billingrad.com>",
                           // to: 'zibx.mail@gmail.com',
                           to:      debug?'zibx.mail@gmail.com':"hello@billingrad.com",
                           subject: "Настала Регистрация"
                        }, function(err, message) {
                            console.log(err || message);
                        });
                        App.q.post('new', {type: 'user', data: data, url: 'api/authorize/getUserById?id='+res.id});

                    }.bind(this));
                }
            };
            if( data.phone )
                store.get('phone', data.phone, result );
            else if( data.email )
                store.get('email', data.email, result );

            return util.wait;
        }else{
            util.error('noLogin');
            return false;
        }
    },
    restore: function( login, password, code, util ){
        /*
        Восстановление пароля

        #in
            login: email || phone - Логин пользователя
            [code]: code - Код подтверждения
            [password]: password - Новый пароль
        */
        if( login.indexOf('@') > 0 ){
            var email = login;
        }else{
            if( Z.validate.phone( login ) ){
                var phone = Z.sanitize.phone( login ).raw;
            }else{
                return util.error('incorrectLogin');
            }
        }

        var result = function( user ){
            if( !user ){
                return util.error('incorrectLogin');
            }
            var bySms = user.doubleAuthorize || !user.email;
            if( code ){
                api.sms.checkCode({phone: user.phone, code: code }, function( result ){
                    console.log(result);
                    if( result === 'ok' ){
                        if( password ){
                            user.password = hashFromString(password);
                            store.edit(user, function(  ){
                                api.authorize.getUserByHash( {hash: user.session, util: util} );
                            }.bind(this));

                        }else
                            util.error('newPassword');
                    }else{
                        util.error('wrongCode');
                    }
                });
            }else{
                var sendObj = {
                    phone: user.phone,
                    text: 'Код подтверждения сброса пароля "{code}"'// code MUST BE wrapped by first quotes
                };
                if( !bySms )
                    sendObj.manual = true;
                api.sms.sendCode(sendObj, function(dat){

                    if( !bySms ){
                        if( dat === false ){
                            util.error( 'timeout' );
                        }else{
                            App.email.send( {
                                text: dat,
                                from: "BILLINGRAD <register@billingrad.com>",
                                to: debug ? 'zibx.mail@gmail.com' : user.email,
                                subject: "Billingrad сброс пароля"
                            }, function( err, message ){
                                console.log( err || message );
                            } );
                            util.error( 'emailCode' );
                        }
                    }else
                        util.error('code');

                });
            }

        };

        if( phone )
            store.get('phone', phone, result);
        else if( email )
            store.get('email', email, result);

        return util.wait;
    },
    login: function( login, password, code, util ){
        /*
         Авторизация
         #in
            login: email || phone - Логин пользователя
            [password]: password - Пароль. Пока as is, рекомендую уже сейчас передавать sha256(password). Если пароль не указан, но у пользователя имеется телефон, то будет произведена авторизация по смс.
            [code]: Код подтверждения
         #out
            #ok
                session-id
            #errors
                Если в базе нет такого пользователя
                #error
                    wrongLogin

                Если пароль неправильный
                #error
                    wrongPassword
                Если в профиле задан телефон, и [code] не передан (нормальный кейс получения кода подтверждения)
                #error
                    code
                Если [code] неправильный
                #error
                    wrongCode

         */

        if( login.indexOf('@') > 0 ){
            var email = login;
        }else{
            if(Z.validate.phone(login)){
                var phone = login = Z.sanitize.phone(login).raw;
            }else{
                return util.error('incorrectLogin');
            }
        }

        var result = function( user ){

            if(user){
                if( util.internal || (!user.phone && password !== void 0) || (password && !user.doubleAuthorize) ){
                    api.authorize._login({
                        login: user.login,
                        password: password,
                        util: util
                    });
                    //util.error('No phone assigned');
                    return util.wait;
                }
                //when double authorize || from mobile
                if( !password || user.password === hashFromString(password) ){
                    var afterCodeStep = function( ){
                        util.internal = true;
                        api.authorize._login({
                            login: user.login,
                            util: util
                        });
                    };
                    if( user.doubleAuthorize || !password ){
                        if( code ){
                            api.sms.checkCode({phone: user.phone, code: code }, function( result ){
                                console.log(result);
                                if( result === 'ok' ){
                                    afterCodeStep();
                                }else{
                                    util.error('wrongCode');
                                }
                            });
                        }else{
                            api.sms.sendCode({
                                phone: user.phone,
                                text: 'Код подтверждения "{code}"'// code MUST BE wrapped by first quotes
                            }, function(){
                                util.error('code');
                            });
                        }
                    }else{
                        afterCodeStep();
                    }
                }else{
                    util.error('wrongPassword');
                }

            }else{
                // register user if not exist
               // api.authorize.register({data: {password: password, login: login, util: util}});
			   //util.error("Неверный логин или пароль");
                util.error('wrongLogin');
            }

        };
        if( phone )
            store.get('phone', phone, result);
        else if( email )
            store.get('email', email, result);

        return util.wait;
    },
    getCode: function( phone, util ){
        api.sms.sendCode({phone: phone, text: 'Код подтверждения "{code}"', util: util});
        return util.wait;

    },
    registerSMS: function( phone, code, util ){
        if( phone && code === phone.substr(phone.length - 4)){
            var pass = Z.UUID.get();
            var data = {};
            data.phone = phone;
            data.password = hashFromString(pass);
            data.login = phone;
            data.approvedPhone = true;
            api.sms.checkCode({
                    phone: phone,
                    code: code
                }, function(  ){
                    data.createDate = +new Date();
                    store.add(data, function(  ){
                        api.authorize.login( {login:data.login, password: pass, util: util} );
                    }.bind(this));
                }
            );
            return util.wait;
        }else
            return false;
    },
    getUserByHash: function( hash, util ){
        /*
         Получить данные профиля пользователя по хэшу
         #in
            hash: session-id - Строка, полученная при логине
         #out
             #ok
                {"_id": "user-id", "login": "userLogin", avatar: "imgSrc", "email": "email", "phone": ""}
             #errors
                Если хэш ошибочный
                 #error
                    wrongSession
         */
        if( !store || !store.get ){
            setTimeout( function(  ){
                api.authorize.getUserByHash({hash: hash, util: util})
            }, 1000 );
            return util.wait;
        }
        if(!hash)
            util.error('wrongSession');
        else
            store.get('session', hash, function( user ){
                if( user ){
                    var answer = Z.apply( {}, user );
                    answer.password = '';
                    setSecurityFlag(answer);
                    util.ok(answer);
                }else
                    util.error('wrongSession');
            });
        return util.wait;
    },
    getUserById: function( id, util, user ){
        if( user && user._id === 'USERNAME' || util.internal ){
            store.get( id, function( user ){
                if( user ){
                    var answer = Z.apply( {}, user );
                    answer.password = '';
                    setSecurityFlag(answer);
                    util.ok( answer );
                }else
                    util.error();
            } );
        }else
            return util.error();
        return util.wait;
    },
    byKeys: function (open, close, util) {
        api.serial.getByOpen({open: open}, function( auth ) {
            if (auth && auth.close === close) {
                api.authorize.getUserById({id: auth.owner}, function (user) {
                    if (user) {
                        delete user.session;
                        setSecurityFlag(user);
                        return util.ok(user);
                    } else {
                        return util.error(false);
                    }
                });
            } else {
                return util.error(false);
            }
        });
        return util.wait;
    },
    getSession: function( uid, user, util ){
        if( user && user._id === 'USERNAME' ){
            store.get( uid, function( instance ){
                if( instance )
                    util.ok(instance.session );
                else
                    util.error();

            });
        }
        return util.wait;
    },
    remove: function( util, id, user ){
        if( id && user && user._id === 'USERNAME' && id !== user._id ){
             store.get( id, function( instance ){
                if( instance && (instance.creator === user._id || user._id === 'USERNAME') ){
                    instance.removed = true;
                    store.edit(instance, function(  ){
                        util.ok(true);
                    });
                }else
                    util.error( 'noSuchUser' );
            });
            return util.wait;
        }else
            return false;
    },
    suicide: function( util, id, user, secret ){                                                                       // #bg-fun
        if( id && user && id === user._id && secret === 'kill me, please' ){
             store.get( id, function( instance ){
                if( instance && user._id === instance._id && user._id !== 'USERNAME' ){
                    store.remove(id, instance._rev, function(  ){
                        util.ok(true);
                    });
                }else
                    util.error('noSuchUser');
            });
            return util.wait;
        }else
            return false;
    },
    who: function( user, util ){
        /*
        Узнать о себе
         */
        var u = Object.create(user);
        u.session = '';
        return u;
    },
    setPassword: function( id, oldPassword, newPassword, user, hash, util ){

        hash = user.session;
        store.get('session', hash, function( user ){
          //  console.log(user)
            if(user){
                //console.log(user.pasword,hashFromString(password))
                if( util.internal || user.password === hashFromString(password) ){

                    user.session = user.session || hashFromString(user.login+user.password + Math.random().toString(26));
                    store.edit(user, function(  ){
                        util.ok(user.session);
                    });
                    return;
                }else{
                    util.error('wrongPassword');
                    return;
                }
            }
            util.error('wrong');
        });
        return util.wait;
    },
    setData: function( data, id, user, hash, util ){
        /*
         Редактирование проекта
         #in
            data
                [phone]: phone - Телефон пользователя
                [email]: email - Email пользователя
                [avatar]: src - Аватар
                [Любые другие данные]
         #out
             Proxy <getUserByHash>
         */
        // TODO: выяснить всё ли норм с правами
        var fn = function( user ){

            if( data.avatar === '' )
                delete data.avatar;
            delete data.id;
            delete data.password;
            delete data.login;
            data.phone && (data.phone = Z.sanitize.phone(data.phone).raw);
            if( user && data ){
                Z.apply(user, data);

                store.edit(user, function(  ){
                    this.getUserByHash( {hash: user.session, util: util} );
                }.bind(this));
            }else
                util.error();

            App.email.send({
               text:    "Дорогие следящие за регистрацией пользователей, у нас изменение!\n" +
                   'Пользователь «'+(data.phone||data.email||data.login)+'».\n' +
                    'А все его данные вот:\n'+
                    (function(data){
                        var o = Z.clone(data);
                        o.session = void 0;
                        o.password = void 0;
                        return JSON.stringify(o,true,2);
                    })(data),
               from:    "BILLINGRAD <register@billingrad.com>",
               to:      debug?'zibx.mail@gmail.com':"hello@billingrad.com",
               subject: "Настало изменение данных профиля"
            }, function(err, message) {
                console.log(err || message);
            });

        }.bind(this);
        if( id && user && user._id === 'USERNAME' )
            store.get( id, fn );
        else
            store.get('session', hash ? hash : user.session, fn);

        return util.wait;
    }
};