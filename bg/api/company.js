var company;
db.need('company', function( storage ){
    company = storage;
    if(storage.isNew){
        console.log('create session hash');
        storage.index('creator');
    }

});
exports = module.exports = {
    create: function( user, data, util ){
		//console.log("Новая компания");
        /*
        Создание компании
        #in#
            data
                [avatar]: imgSrc
                [bank]: text
                [bik]: text
                [bill]: text
                [correspondenAccout]: text
                [email]: text
                [fullName]: text
                [inn]: text
                [kpp]: text
                name: text - название компании
                [officialAddress]: text
                [ogrn]: text
                [phone]: phone
                [realAddress]: text
                [shortName]: translit_text

        #ok
            company-id
        */
        data = data || {};
        Z.apply(data, {
            creator: user._id,
            createDate: +new Date()
        });
        company.add(data, function( err, res ){
            util.ok(res.id);
        });
        return util.wait;
    },
    edit: function( user, id, data, util ){
                /*
        Редактирование компании
        #in#
            data
                id: company-id
                [любые редактируемые данные]

        #out
            #ok
                true
            #errors
                Компания не существует
                #error
                    noSuchCompany
        */
        id = id || data.id;
        if(data.avatar === '')
            delete data.avatar;
        company.get( id, function( instance ){
            if( instance && instance.creator === user._id ){
                Z.apply(instance, data);
                company.edit(instance);
                util.ok(true);
            }else
                util.error('noSuchCompany');
        });
        return util.wait;
    },
    remove: function( user, id, util ){
        /*
        Удаление компании
        #in#
            id: company-id - ID удаляемой компании

        #out
            #ok
                true
            #errors
                Компании с указанным id не существует || нет прав на удаление
                #error
                    noSuchCompany
        */
        company.get( id, function( instance ){
            if( instance && instance.creator === user._id ){
                company.remove(id, instance._rev);
                util.ok(true);
            }else
                util.error('noSuchCompany');
        });
        return util.wait;
    },
    get: function( user, util, id ){
        /*
        Получить данные компании по id
        #in#
            id: company-id - ID проекта

        #out
            #ok
                {все данные as is}
            #errors
                Компании с указанным id не существует || нет прав на удаление
                #error
                    noSuchCompany
        */
        company.get( id, function( instance ){
            if( instance && instance.creator === user._id ){
                instance.id = instance._id;
                delete instance._id;
                util.ok(instance);
            }else
                util.error('noSuchCompany');
        });
        return util.wait;
    },
    getAll: function( user, util ){
        //#can user company.list in system: billingrad
        company.getAll('creator', function( list ){
            util.ok( list.map( function( el ){
                el.id = el._id;
                delete el._id;
                return el;
            }) );
        });
        return util.wait;
    },
    list: function( user, util ){
        /*
        Получить список компаний
        #out
            #ok
                [{"name": "companyName"... все данные}, ...]
        */
        company.getList('creator', user._id,function( list ){
            util.ok( list.map( function( el ){
                el.id = el._id;
                delete el._id;
                return el;
            }) );
        });
        return util.wait;
    }
};