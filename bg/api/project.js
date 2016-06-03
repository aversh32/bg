/*var instances = {},
    apiKeyHash = {},
    creatorHash = {},
    Instance = function( cfg ){
        instances[this.id = Z.UUID.getRandom()] = this; //TODO check if not exists
        Z.apply(this, cfg);

        (creatorHash[this.creator] = (creatorHash[this.creator] || [])).push(this);

    };
Instance.prototype = {
    getApiKey: function(  ){
        if( !this.apiKey )
            apiKeyHash[this.apiKey = Z.UUID.getRandom()] = this;
        return this.apiKey;
    },
    newApiKey: function(  ){
        this.remove(true);
        return this.getApiKey();
    },
    remove: function( apiKeyOnly ){
        if( this.apiKey ){
            delete apiKeyHash[ this.apiKey ];
            delete this.apiKey;
        }
        if( this.creator ){
            var userProjects = creatorHash[this.creator];
            if( userProjects )
                for(var i = userProjects.length;--i;)
                    if(userProjects[i] === this)
                        userProjects.splice(i,1);
        }
        if( !apiKeyOnly )
            delete instances[ this.id ];
    },
    edit: function( data ){
        Z.apply(this, data);
    }
};*/
var projects;
db.need('project', function( storage ){
    projects = storage;
    if(storage.isNew){
        console.log('create session hash');
        storage.index('creator');
    }
    if( GLOBAL.createBG )
    storage.add({
        _id: 'MAINPROJ',
        creator: 'USERNAME',
        smsPrice: 110,
        createDate: +new Date(),
        name: 'MAINPROJ'
    });
	//function(){};
	
    setTimeout( function(  ){
        projects.getAll('creator', function( list ){
            var t = list[list.length - 1];

            api.access.can({
                uid: t.creator,
                instance: t._id,
                type: 'project',
                action: 'project.view'
            }, function( res ){
                return false;
                if( res === false ){
                    console.green('Migrate project rights');
                    list.forEach( function( t ){
                        api.access.grant({
                            uid: t.creator,
                            type: 'project',
                            iid: t._id,
                            role: 'creator'
                        });
                    });
                }
            } );

        });
    },0);
});
var cosher = require('z-redis-cosher');
var projectCache = new cosher({
    name: 'project',
    idKey: 'id',
    timeout: 240,
    connectCfg: App.cfg.redis,
    query: function( id, cb ){

        projects.get( id, function( instance ){
            if( instance ){
                instance.id = instance._id;
                delete instance._id;
                cb( instance );
            }else{
                cb(null);
            }
        })

    }
});
exports = module.exports = {
    schema: function(  ){
        /*
        Project scheme
        #in#
            id:hash,pid,iid,project-id - project id deprecated
            name:text - имя проекта
            createDate:date - дата создания
            creator:hash - создатель. deprecated
            smsPrice:int - цена смс в копейках
            fullName:text - полное имя проекта
            description:text - описание проекта
            sender:array - список отправителей смс
                sender:text - отправитель
                approved:bool - подтверждено
                date:date - дата создания
            request:object - оповещения
                !name:object - название
                    type:text - название
                    method:text - тип запроса
                    url:tpl - адрес запроса
                    body:tpl - тело сообщения
            box:object - настройки плугинов
                !name:json - имя модуля. любые данные. документация в схеме модуля

        */
    },
    notify: function( type, data, pid, util ){
        if( !util.internal )
            return false;

        api.project.get({pid:pid}, function( project ){
            if(!project)
                return util.error();
            if( type[0] === 'balanceNotify' ){
                var notifyType = project.balanceNotify || 'sms';
                App.q.post('notify',
                    {
                        type: 'project.balanceNotify',
                        notifyType: notifyType,
                        data: data,
                        pid: pid});
                util.ok('true');
            }
            /*
{
 "job": "mailer@handleQueuedMessage",
 "data": {
 "view": "emails.project.low_balance",
 "data": [],
 "callback": "C:38:\"Illuminate\\Support\\SerializableClosure\":139:{a:2:{i:0;s:110:\"function ($message) {\n $message->to('rs@billingrad.com', 'Джон Смит')->subject('Привет!');\n};\";i:1;a:0:{}}}"
 },
 "attempts": 1,
 "queue": "notify"
}
             */
        });
        return util.wait;
    },
    getStat: function( id, util, user ){
        /*
        Получение статистики по проекту
        #in#
            id:hash - project id

        #ok
            {"created": timestamp,"smsCount": smsSendedCount,"balance":{"amount": balance}}
        #errors
            Проект с данным id отсутствует
            #error
                noSuchProject
        #can user project.view in project: id
        */

        var out = {};
        Z.doAfter( function(callback){
            api.project.getBalance({id: id, user: user}, function( result ){
                Z.apply(out,{balance: result});
                callback();
            });
        },function(callback){
            api.costs.getCosts({pid: id, user: user}, function( result ){
                Z.apply(out,{smsPrice: result.sms['default'].price});
                callback();
            });
        },function(callback){
            api.delivery.getSendedCount({owner: id, user: user}, function( result ){
                Z.apply(out,{smsCount: result});
                callback();
            });
        }, function( callback ){
            projects.get( id, function( instance ){
                if( instance ){
                    Z.apply(out,{created: new Date( instance.createDate ).toString()});
                    callback();
                }else
                    util.error('noSuchProject');
            });
        }, function(  ){
            util.ok(out);
        });

        return util.wait;
    },
    getBalance: function( user, id, util ){
        /*
        Получение баланса проекта проекту
        #in#
            id:hash - project id

        #ok
            {"amount": balance}
        #errors
            Проект с данным id отсутствует
            #error
                noSuchProject

        #can user project.viewBalance in project: id
        */
        //App.can( user, 'project.viewBalance', id );
        /*api.access.can({
            u: user,
            instance: id,
            action: 'project.viewBalance'
        }, function( can ){

           console.green(JSON.stringify(data));
        });*/
        projects.get( id, function( instance ){
            if( instance && (instance.creator === user._id|| user._id === 'USERNAME') ){
                api.balance.get({owner: instance._id, from: instance._id, user: user}, function( balance ){
                    //console.log(balance);
                    util.ok({amount: balance.amount});
                });

            }else
                util.error('noSuchProject');
        });
        return util.wait;
    },
    create: function( user, data, first, util ){
        /*
        Создание проекта
        #in#
            data
                name:text - имя проекта (для отображения в системе)
                fullName:text - полное название
                description:text - описание проекта
                avatar: imgSrc - аватарка проекта

        #ok
            project-id
        */
        first = util.internal ? first : false;
        data = data || {};
        Z.apply(data, {
            creator: user._id,
            smsPrice: 110,
            createDate: +new Date()
        });

        projects.add(data, function( err, res ){
            api.access.grant({uid: user._id, type: 'project', iid: res.id, role: 'creator'});
			console.dir("Кэш проектов   "+projectCache);
            projectCache.remove(res.id);
			console.log("2raz       ");
			//console.dir("Кэш проектов   "+projectCache);
            api.balance.create({owner: res.id, amount: first ? data.smsPrice * 20 : 0}, function(  ){
                if( App.io.in(user._id)[0] )
                    App.io.in(user._id)[0].join(res.id);
                util.ok(res.id);
                App.q.post('new', {type: 'project', data: data, url: 'api/project/get?id='+ res.id});
            });
        });
        return util.wait;
    },
    sender: function( user, instance, deny, info, util ){
        if(!util.internal)
            return util.error('internalOnly');
        var sender = instance.data.sender;
        projects.get( instance.creator, function( project ){
            var change = false;

            if( info ){
                api.authorize.getUserById({id: project.creator}, function( creator ){
                    if( creator ){
                        util.ok( {
                            project: project,
                            creator: creator
                        } );
                    }else{
                        util.error('noSuchUser');
                    }
                });

            }else{
                (project.sender || []).forEach( function( el ){
                    if(el.sender === sender && !el.approved){
                        change = true;
                        if( deny ){
                            el.deny = true;
                        }else{
                            el.approved = true;
                        }
                    }
                });
                if( change ){
                    projects.edit(project);
                    util.ok('')
                }else{
                    util.ok('no');
                }
            }
        });

        return util.wait;
    },
    ability: function( user, instance, deny, info, util ){

        if(!util.internal)
            return util.error('internalOnly');

        projects.get( instance.creator, function( project ){
            var change = false;

            if( info ){
                api.authorize.getUserById( {id: project.creator}, function( creator ){
                    if( creator ){
                        util.ok( {
                            project: project,
                            creator: creator
                        } );
                    }else{
                        util.error( 'noSuchUser' );
                    }
                } );
            }else{
                var obj = {deny: !!deny, approved: !deny},
                    ability;
                if( !deny ){
                    //granting
                    ability = instance.data.ability;
                    if( ability === 'delivery' ){
                        api.access.grant({
                            uid: project.creator,
                            type: 'project',
                            iid: instance.data.pid,
                            role: 'smsSender'
                        });
                    }else if( ability === 'mfo' ){
                        api.access.grant({
                            uid: project.creator,
                            type: 'project',
                            iid: instance.data.pid,
                            role: 'mfo'
                        });
                    }
                }


                api.project.box({pid: instance.data.pid, type: instance.data.ability, data: obj});
                util.ok('')

            }
        });
        return util.wait;

    },
    requestAbility: function( pid, type, user, util ){
        /*
        Запрос на одобрение действия
        #can user project.requestAbility in project: pid
         */
        var uid = user._id;
        api.project.box({
            pid: pid,
            type: type,
            data: {
                requested: true
            }
        }, function(  ){
            Z.doAfter( function( callback ){
                if( uid === 'USERNAME' ){
                    api.project.get({id: pid}, function( proj ){
                        uid = proj.creator;
                        callback();
                    });
                }else
                    callback();
            }, function(  ){
                api.collaborate.create( {
                    data: {ability: type, pid: pid, uid: uid, date: +new Date()},
                    creator: pid,
                    approver: 'USERNAME',
                    type: 'ability',
                    resolver: 'project.ability'
                }, function(){
                    util.ok();
                } );
            });

        });

        return util.wait;
    },
    box: function( pid, type, data, overwrite, user, util ){

        if( !util.internal && user._id !== 'USERNAME' )
            return false;


        projects.get( pid, function( instance ){

            if( !instance )
                return util.error(false);

            if( data === void 0 ){
                if( instance )
                    return util.ok( instance[type] || {} );
                else
                    return util.error('noSuchProject');
            }else{
                instance[type] = instance[type] || {};
                if( overwrite )
                    instance[type] = data;
                else
                    Z.apply(instance[type], data);
                projectCache.remove(instance._id);
                if( !Z.isArray(data) )
                    instance[type]._isBox = true;

                projects.edit(instance, function(  ){
                    //console.log(arguments);
                    //debugger;
                });
                return util.ok(instance[type])
            }
        });

        return util.wait;
    },
    removeSender: function( user, id, sender, util ){
        /*
        Удаление имени отправителя
        #in#
            data
                id:project-id - ID проекта
                sender:text - отправитель
        #out
            #ok
                ok
            #errors
                Отправитель не существует
                #error
                    noSuchPrefix
                Проект с указанным id не существует
                #error
                    noSuchProject
        #can user project.addSender in project: id
        */
        projects.get( id, function( instance ){
            if( instance && (instance.creator === user._id || user._id === 'USERNAME' )){
                instance.sender = instance.sender || [];
                var pos;
                if( ( pos = instance.sender.map( Z.getProperty('sender') ).indexOf(sender) )> -1 ){
                    instance.sender.splice(pos,1);
                    api.collaborate.remove({
                        data: {sender: sender},
                        creator: instance._id,
                        type: 'sender',
                        resolver: 'project.sender'
                    }, function(  ){

                    });
                    projects.edit(instance);
                    util.ok('ok');
                }else{
                    util.error('noSuchPrefix');
                }

            }else
                util.error('noSuchProject');
        });
        return util.wait;
    },
    setResponse: function( user, id, type, response, util ){
        /*
        Добавить\отредактировать настройки ассинхронного ответ
        #in#
            id:project-id - ID проекта
            type:text - событие оповещения (например, mc)
            response
                url:text - адрес
                method:enum - GET или POST
                [body]:text - для POST запроса
        #out
            #ok
                ok
            #errors
                Проект с указанным id не существует
                #error
                    noSuchProject
        #can user response.manage in project: id
         */

        projects.get( id, function( instance ){
            if( !instance )
                return util.error('noSuchProject');
            instance.request = instance.request || {};
            instance.request[type] = response;
            projects.edit(instance);
            util.ok('ok');
        } );
        return util.wait;
    },
    removeResponse: function( user,id,type,util ){
        /*
        Удалить настройки ассинхронного ответ
        #in#
            id:project-id - ID проекта
            type:text - событие оповещения (например, mc)
        #out
            #ok
                ok
            #errors
                Проект с указанным id не существует
                #error
                    noSuchProject
                Нет такого события
                #error
                    noSuchType
        #can user response.manage in project: id
         */
        projects.get( id, function( instance ){
            if( !instance )
                return util.error('noSuchProject');
            instance.request = instance.request || {};
            if( !instance.request[type] )
                return util.error('noSuchType');
            delete instance.request[type];
            projects.edit(instance);
            util.ok('ok');
        } );
        return util.wait;
    },
    addSender: function( user, id, sender, util ){
        /*
        Создание запроса на подтверждение имени отправителя
        #in#
            data
                id:project-id - ID проекта
                sender:text - отправитель
        #out
            #ok
                ok
            #errors
                Отправитель уже существует
                #error
                    alreadyExists
                Проект с указанным id не существует
                #error
                    noSuchProject
        #can user project.addSender in project: id
        */
        projects.get( id, function( instance ){
            if( instance && (instance.creator === user._id || user._id === 'USERNAME' )){
                instance.sender = instance.sender || [];
                if( instance.sender.map( Z.getProperty('sender') ).indexOf(sender) > -1 )
                    util.error('alreadyExists');
                else{
                    instance.sender.push({
                        sender: sender,
                        approved: false,
                        date: +new Date()
                    });
                    api.collaborate.create({
                        data: {sender: sender, date: +new Date()},
                        creator: instance._id,
                        approver: 'USERNAME',
                        type: 'sender',
                        resolver: 'project.sender'
                    }, function(  ){
                        
                    });

                    projects.edit(instance);
                    util.ok('ok');
                }

            }else
                util.error('noSuchProject');
        });
        return util.wait;
    },
    edit: function( user, data, util ){
        /*
        Редактирование проекта
        #in#
            data
                id: project-id - ID редактируемого проекта
                [любые данные]

        #out
            #ok
                true
            #errors
                Проект с указанным id не существует || нет прав на редактирование
                #error
                    noSuchProject

        #can user project.edit in project: data.id
        */

        var id = data.id;

        projects.get( id, function( instance ){
            if( instance ){
                delete data._id;
                delete data.id;
                delete data.request;
                if( user._id !== 'USERNAME' ){
                    delete data.smsPrice;
                    delete data.smsGate;
                }
                var change = {},
                    wasChange = false;
                for(var i in data) if( data.hasOwnProperty(i) ){
                    if(data[i] !== instance[i]){
                        change[i] = {from: instance[i], to: data[i]};
                        wasChange = true;
                        instance[i] = data[i];
                    }
                }
                if(wasChange){
                    projects.edit(instance, function(  ){
                        projectCache.remove(id);
                        util.ok(true);
                        api.gear.rotate({
                            iid: id,
                            type: 'project',
                            event: 'change',
                            data: change,
                            info: instance
                        });
                    });
                }



            }else
                util.error('noSuchProject');
        });
        return util.wait;
    },
    remove: function( user, id, util ){
        /*
        Удаление проекта
        #in#
            id: project-id - ID удаляемого проекта

        #out
            #ok
                true06
            #errors
                Проект с указанным id не существует || нет прав на удаление
                #error
                    noSuchProject
        #can user project.remove in project: id
        */
        projects.get( id, function( instance ){
            if( instance && (instance.creator === user._id || user._id === 'USERNAME') ){
                projects.remove(id, instance._rev, function(  ){
                    projectCache.remove(id);
                    util.ok(true);
                });
            }else
                util.error('noSuchProject');
        });
        return util.wait;
    },
    push: function (util, _body, pid) {
        api.gear.rotate({
            iid: pid,
            type: 'project',
            event: 'push',
            util: util,
            _body: _body
        });
        return util.wait;
    },
    get: function( user, util, id ){
        /*
        Получить данные проекта по id
        #in#
            id: project-id - ID проекта

        #out
            #ok
                {"name": "projectName"... все данные}
            #errors
                Проект с указанным id не существует || нет прав на удаление
                #error
                    noSuchProject
        #can user project.view in project: id
        */
        projectCache.get(id, function( err, instance ){
            if( instance ){
                util.ok(instance);
            }else
                util.error('noSuchProject');
        });

        return util.wait;
    },
    list: function( user, util ){
        /*
        Получить список проектов
        #out
            #ok
                [{"name": "projectName", smsPrice: цена в копейках, ... все данные}, ...]

        */
        console.log('project.list @@',user, '$$',App.realUser(user),'$$');
        api.access.byType({
            u: user,
            type: 'project',
            action: 'project.view'
        }, function (list) {
            if(list === '*'){
                projects.getAll('creator', function( list ){
                    util.ok( list.map( function( el ){
                        el.id = el._id;
                        delete el._id;
                        return el;
                    }) );
                });
            }else
                projects.getList( list,function( list ){
                    util.ok( list.map( function( el ){
                        el.id = el._id;
                        delete el._id;
                        return el;
                    }) );
                });

        });
/*

        console.log( )
        if( user._id === 'USERNAME'){
            projects.getAll('creator', function( list ){
                util.ok( list.map( function( el ){
                    el.id = el._id;
                    delete el._id;
                    return el;
                }) );
            });
        }else{
            projects.getList('creator', user._id,function( list ){
                util.ok( list.map( function( el ){
                    el.id = el._id;
                    delete el._id;
                    return el;
                }) );
            });
        }
*/

        return util.wait;
    },
    getAll: function( user, util ){
        //#can user project.list in system: billingrad
        projects.getAll('creator', function( list ){
            util.ok( list.map( function( el ){
                el.id = el._id;
                delete el._id;
                return el;
            }) );
        });
        return util.wait;
    },
    getMessageLog: function( user, id, page, util ){
        /*
        Получить лог отправленных смс
        #in#
            id: project-id - ID проекта
            page: int - страница

        #out
            #ok
                #js
                    {
                        pages: pageCount,
                        page: currentPage,
                        items: [
                            {id: id, text: text, phone: to, status: messageStatus, date: timestamp},
                            ...
                        ]
                    }
        */
        page = page || 0;
        var perPage = 40;

        api.sms.getLog({user: user, owner: id, page: page, perPage: perPage}, function( data ){
            util.ok({
                pages: Math.ceil(data.total_rows/perPage),
                page: page,
                items: data.rows.map( function( el ){
                    var date = Z.getDateFromArray(el.value.date);
                    return {id: el.id, text: el.value.text, phone: el.value.phone, status: el.value.status, date: date.valueOf() };
                })
            });
        });
        return util.wait;
    },
    balanceNotify: function( data, user, util ){
        
    }
};
