exports = module.exports = function(context){
    var t = context.t, wFactory = context.wFactory;
    return wFactory.build({
        xid: 'form',
        sendTo: 'api/authorize/setData/',
        sendAs: 'data',

        cls: 'b-reg-list__form',
        items: [
            {type: 'title', text: 'Профиль'},
            {id: 'avatar',  type: 'image', text: 'Загрузить', value: context.user.avatar},
            {id: 'surname', bordered: true, type: 'text', text: 'Фамилия', placeholder: 'Фамилия', value: context.user.surname},
            {id: 'name', bordered: true, type: 'text', text: 'Имя', placeholder: 'Имя', value: context.user.name},
            {id: 'email', bordered: true, type: 'email', text: 'Ваш e-mail', placeholder: 'Электронная почта', value: context.user.email},
            {id: 'phone', bordered: true, type: 'phone', text: 'Телефон', placeholder: 'Телефон', value: context.user.phone},
            {type: 'submit', text: 'Изменить'}
        ]

    });
};