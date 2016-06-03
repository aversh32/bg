/**
 * Created by Ivan on 9/9/2014.
 */
var db = Z.pg.use('agree');
exports = module.exports = {
    add: function( data, type, user, util ){
        /*
        Добавление согласия
        #in
            data: object - json объект со всеми известными данными о пользовательсом окружении
            type: string - тип соглашения [mobile|web|contacts]
        #out
            agree-id

         */
        if(!user || util.internal)
            return false;

        var req = util.response.req;
        if(typeof data !== 'object')
            data = {};
        data.connection = {
            forward: req.headers['x-forwarded-for'],
            ip: req.connection.remoteAddress
        };
        var co;
        db.add('agree', co = {
            u: user._id,
            type: type,
            data: JSON.stringify(data),
            createDate: +new Date()
        }, function( err, data ){
            util.ok(data.aid);
            App.q.post('new', {type: 'agree', data: co, url: 'api/agree/getById?id='+ data.aid});
        });

        return util.wait;
    },
    list: function( type, util, user ){
        db.getList('agree','u',user._id, function( list ){
            util.ok(list);
        });
        return util.wait;
    },
    getById: function( id, util, user ){
        db.get('agree', id, function(res){
            if(user && user._id === 'USERNAME' || user._id === res.u){
                return util.ok(res);
            }else{
                return util.error();
            }
        });
        return util.wait;
    },
    get: function( type, util ){
        /*
        Получение ссылки на оферту
        #in
            type: string - тип оферты. [mobile|web]
        #out
            Ссылка на файл оферты
            #errors
                Оферта такого типа не существует
                #error
                    noOffer
         */
        if( type === 'mobile' ){
            util.ok('mobileOffer.pdf');
        }else{
            util.error('noOffer')
        }

        return util.wait;
    }
};