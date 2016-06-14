
var contact,  list;
var contacts = Z.pg.use('contacts');

var phoneMap = function(el){
    var obj = {phone: el.phone,id: el.cid, lid: el.lid};
    Z.apply(obj, JSON.parse(el.json));
    return obj;
};

/*db.need('contactList', function( storage ){
    contact = storage;
    if(storage.isNew){
        console.log('create session hash');
        storage.index('creator');
    }
});*/
db.need('contact', function( storage ){
    list = storage;
    if(storage.isNew){
        console.log('create session hash');
        storage.index('creator');
    }
    list.get('exported', function( item ){
        if(!item){
            list.getAll('creator', function( list ){
                list.forEach( function( list ){
                    if( list.list && list.list.length ){
                        var u = {_id:list.creator};
                        api.contactList.create({user: u, data: {name: list.name}},
                            function( id ){
                                api.contactList.addItem({user: u, id: id, data:list.list.map( function( el ){
                                    return {phone:el.phone, name: el.name};
                                })}, function(){
                                    console.log('exported '+list.name);
                                })
                            })
                    }
                });

                /*console.log(list.map( function( list ){
                   return [list._id, list.name, list.list && list.list.length];
                }));*/
            });
            list.add({_id: 'exported'});
        }
    });
});


exports = module.exports = {
    create: function( user, data, util ){
        /*
        Создание списка контактов
        #in#
            data
                name: text - Название списка
        #ok
            list-id
        */
        data = data || {};

        contacts.add('list', {
                name: data.name,
                creator: user._id,
                createDate: new Date()
            }, function( err, result ){
                if( err ){
                    util.error(err.toString());
                }else{
                    util.ok(result.lid);
                }
        });

        return util.wait;
    },
    addItem: function( user, id, data, util ){
        /*
        Добавление телефона в список
        #in#
            id: list-id - id списка, в который добавляем
            data
                phone: phone - Телефон
                [sex]: enum - male\female || м\ж\хз || другой формат
                [email]: email
                [любые другие данные, полезно для шаблонизации]
        #out
            #ok
                item-id
            #errors
                Список не существует\нет прав
                #error
                    noSuchList
                Очень странный телефон
                #error
                    incorrectPhone
        */
        id = id || data.id;
        contacts.get( 'list', id, function( instance ){
            if( instance && (instance.creator === user._id || user._id==='USERNAME') ){

                data = Z.makeArray(data);
                contacts.add('contacts', data.map( function( data ){
                    var phone = data.phone.substr(0,16);
                    delete data.lid;
                    delete data.phone;
                    return {
                        lid: id,
                        phone: phone,
                        json: JSON.stringify(data)
                    }
                } ), function( err, result ){
                    if( err ){
                        util.error(err.toString());
                    }else{
                        contacts.edit( 'list', id, {length: (instance.length|0) + data.length }, function( ){
                            util.ok(result.cid);
                        });
                    }
                });
            }else
                util.error('noSuchList');
        });
        return util.wait;
    },
    getItem: function( user, id, data, util ){
        /*
        Получить данные контакта
        #in#
            id: list-id - id списка, в котором редактируется запись
            data
                id: item-id - ID элемента списка
                [любые данные для фильтрации. предпочтительно - id]
         */
        if( data.id ){
            contacts.get( 'contacts', data.id, function( instance ){
                if( instance.lid === id ){
                    return phoneMap(instance);
                }
            });
        }
        return util.wait;
    },
    editItem: function( user, id, data, util ){

        /*
        Добавление телефона в список
        #in#
            id: list-id - id списка, в котором редактируется запись
            data
                id: item-id - ID элемента списка
                [любые новые данные] (произойдёт наложение на старые)
        #out
            #ok
                item-id
            #errors
                Список не существует\нет прав
                #error
                    noSuchList
        */
        contacts.get( 'list', id, function( instance ){
            if( instance && instance.creator === user._id || user._id==='USERNAME'){
                contacts.get( 'contacts', data.id, function( instance ){
                    //var obj = instance;
                    instance.json && Z.apply( instance, JSON.parse(instance.json) );
                    Z.apply( instance, data );
                    var phone = instance.phone;
                    var cid = data.id;
                    delete instance.id;
                    delete instance.phone;
                    delete instance.cid;
                    delete instance.lid;
                    delete instance.json;
                    var json = JSON.stringify(instance);
                    contacts.edit( 'contacts', cid, {lid: id, phone: phone, json: json}, function(  ){
                        util.ok(true);
                    } );
                });

            }else
                util.error('noSuchList');
        });
        return util.wait;
    },
    removeItem: function( user, id, data, util ){
        /*
        Удаление телефона из списка
        #in#
            id: list-id - id списка, в котором редактируется запись
            data
                id: item-id - ID элемента списка
        #out
            #ok
                true
            #errors
                Список не существует\нет прав
                #error
                    noSuchList
        */
        contacts.get( 'list', id, function( instance ){
            if( instance && instance.creator === user._id ){
                contacts.edit( 'list', id, {length: (instance.length|0) - 1 });
                contacts.remove('contacts', data.id, function(  ){
                    util.ok(true);
                });
            }else
                util.error('noSuchList');
        });
        return util.wait;
    },
    edit: function( user, id, data, util ){
        /*
        Редактирование списка
        #in#
            data
                id: list-id - id списка
                name: text - название списка
                [list]: массив объектов телефонов - Позволяет отредактировать\удалить много телефонов одним запросом. Важно: поле id в случае создание списка телефонов таким способом нужно генерировать самостоятельно.
        #out
            #ok
                true
            #errors
                Список не существует\нет прав
                #error
                    noSuchList
        */

        id = id || (data && data.id);
        if(id === void 0)
            return util.error('noSuchList');
        contacts.get( 'list', id, function( instance ){
            if( instance && (instance.creator === user._id|| user._id==='USERNAME') ){
                delete data._id;
                delete data.id;
                delete data.lid;
                console.log('is cl');
                Z.doAfter( function( callback ){
                    if( data.list ){
                        var list = data.list;
                        contacts.remove( 'contacts', 'lid', id, function(){
                            console.log('r1 cl');
                            contacts.edit( 'list', id, {length: 0}, function(  ){
                                console.log('ir2 cl');
                                console.log('dl', list.length);
                                api.contactList.addItem({user: user, id: id, data:list}, function(){
                                    console.log('dl fin', list.length);
                                    callback()
                                });
                            });
                        });
                        delete data.list;
                    }else{
                        callback();
                    }
                }, function(  ){
                    contacts.edit( 'list', id, data, function(  ){
                        util.ok(true);
                    });
                })


            }else
                util.error('noSuchList');
        });
        return util.wait;


        list.get( id || data.id, function( instance ){
            if( instance && instance.creator === user._id ){
                Z.apply(instance, data);
                list.edit(instance);
                util.ok(true);
            }else
                util.error('noSuchList');
        });
        return util.wait;
    },
    remove: function( user, id, util ){
        /*
        Удаление списка
        #in#
            id: list-id - id списка
        #out
            #ok
                true
            #errors
                Список не существует\нет прав
                #error
                    noSuchList
        */
        contacts.get( 'list', id, function( instance ){
            if( instance && instance.creator === user._id ){
                contacts.remove('list', id, function( err, data ){
                    util.ok(true);
                });
            }else
                util.error('noSuchList');
        });
        return util.wait;

        list.get( id, function( instance ){
            if( instance && instance.creator === user._id ){
                list.remove(id, instance._rev);
                util.ok(true);
            }else
                util.error('noSuchList');
        });
        return util.wait;
    },
    export: function( id, format, user, util ){
        /*
        Экспорт списка
        #in#
            id: list-id - id списка
            format: text - формат экспорта
        #out
            #ok
                url - адрес для скачивания файла
        */
        contacts.get( 'list', id, function( instance ){
            if( instance && (instance.creator === user._id|| user._id==='USERNAME') ){
                api.contactList.get( {id:id, user: user}, function( rows ){
                    var hash = {}, i, _i, j, row;
                    for( i = 0, _i = rows.length; i < _i; i++ ){
                        row = rows[i];
                        for( j in row ){
                            hash[j] = true;
                        }
                    }
                    for( j in hash ){
                        hash[j] = [];
                    }
                    for( i = 0; i < _i; i++ ){
                        row = rows[i];
                        for( j in row ){
                            hash[j][i] = row[j];
                        }
                    }
                    delete hash.lid;
                    delete hash.id;

                    var out = [];
                    row = [];
                    for( j in hash ){
                        row.push(j);
                    }
                    out.push(row.join(';'));
                    for( i = 0; i < _i; i++ ){
                        row = [];
                        for( j in hash ){
                            row.push(hash[j][i]);
                        }
                        out.push(row.join(';'));
                    }
                    var response = util.response;

                    response.header('Content-disposition', 'attachment; filename=' + instance.name+'.csv');
                    response.header('Content-Type', 'text/csv; charset=utf-8');
                    response.send('\uFEFF'+out.join('\n'));


                });
            }
        } );
        return util.wait;
    },
    get: function( user, id, util, full, assync ){
        /*
        Получить данные списка
        #in#
            id: list-id - id списка
            [full]: boolean - вернуть только список номеров (false [default]) или полный объект списка (true)
        #out
            #ok
                #title
                    full = true
                #js
                    {
                        name: name,
                        list: [
                            {id: id, phone: phone, name: name},
                            ...
                        ]
                    }
                #title
                    full = false
                #js
                    [
                        {id: id, phone: phone, name: name},
                        ...
                    ]

            #errors
                Список не существует\нет прав
                #error
                    noSuchList
        */

        contacts.get( 'list', id, function( instance ){
			console.log("id="+id);
            if( instance && (instance.creator === user._id|| user._id==='USERNAME') ){
                contacts.getList( 'contacts', 'lid', id, function( rows ){
                    var c = rows.map(phoneMap);
                    util.ok(full ? {name: instance.name, list: c} : c);
                }, assync);
            }else
                util.error('noSuchList');
        });
        return util.wait;
    },
    getAssync: function( to, action, util, user ){
        if( !util.internal )
            return false;
        var act;
        if( typeof action === 'function' ){
            act = {data: function(){}, fn: action};
        }else
            Z.each(action, function( key, val ){
                var tokens = key.split('.');
                var f = function(){};
                f.prototype = val;
                act = {fn: api[tokens[0]][tokens[1]], data: f};
            });
        var c = 0,
            callback = function(){
                c--;
                if(c===0){
                    doAct();
                }
            },
            doAct = function(  ){
                var o = new act.data();
                o.data = result;
                act.fn( o );
            },
            trimFn = function( el ){
                return el.trim();
            },
            filterFn = function( el ){
                return el !== '';
            },
            result = [];

        api.contactList.list({user: user}, function( lists ){
            var hash = Z.makeHash(lists, 'name');

            to.split(/[,;]/ )
                .map( trimFn )
                .filter( filterFn )
                .forEach( function( el ){
                    c++;
                    if( hash[el] ){

                        // достаём руками
                        api.contactList.get({user: user, id: hash[el].id}, function( data ){
                            Z.ass( data || [], function( el ){
                                el.forEach( function( el ){
                                    var o = new act.data();
                                    var phone = el.phone = Z.sanitize.phone(el.phone||'').raw;
                                    o.contact = el;
                                    if( Z.validate.phone(phone) ){
                                        result.push(el);
                                    }
                                });
                            }, 200, callback, true);
                        });
                    }else{
                        if( Z.validate.phone(el) ){
                            result.push({ phone: Z.sanitize.phone(el).raw});
                        }
                        setImmediate(callback);
                    }
                });
        });
        return true;

        contacts.getList( 'contacts', 'lid', id, function( err, result ){
            var c = result.rows.map(function( el ){
                var obj = {phone: el.phone,id: el.cid, lid: id};
                Z.apply(obj, JSON.parse(el.json));
                return obj;
            });
			console.log("OBJ");
				console.dir(c);
            util.ok(full ? {name: instance.name, list: c} : c);
        });
        return util.wait;
    },
/*    getByKey: function( user, key ){
        key = Z.makeArray(key);
        var lists = creatorHash[user.id];
        var out = [];
        for( var i = 0; i < lists.length; i++ ){
            var l = lists[i];
            if( key.indexOf(l.key) > -1 ){
                out.push( l );
            }
        }
        return out;
    },*/
    list: function( user, util ){
        /*
        Получить все доступные списки
        #out
            #ok
                [{length: n, id: id, name: name}, ...]
        */
        contacts.getList( 'list', 'creator', user._id, function( rows ){
            util.ok( rows.map( function( el ){
                return { length: el.length, id: el.lid, name: el.name };
            }) );
        } );
        return util.wait;

        list.getList('creator', user._id,function( list ){

            util.ok( list.map( function( el ){
                return { length: el.list.length, key: el.key, id: el._id, name: el.name };
            }))
        });
        return util.wait;
    }
};
