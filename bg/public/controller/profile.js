Z.controller.profile = {
    tpls: ['form'],
    init: function(){
        this.route = [];
    },
    router: function(){
        var content = document.getElementById('content');
        var context = {user: Z.user.data};
        var subMenu = document.getElementById('subMenu');
        $(subMenu).stop().css({'left':'0px','margin-right':'0px'} ).hide();
        widgets.form({
            renderTo: content,
            success: function( data ){
                Z.user.data = data.data;
                Z.menu.lastData[0].img = data.data.avatar;
                Z.menu('profile');
                $.gritter.add({
                    //title: 'Изменения сохранены',
                    text: 'Данные были успешно сохранены'
                });
            },
            validate: function( data ){
                var wasError = false;
                var email = data.email.trim();
                if( email !== '' && Z.validate.email(email) === false ){
                    $(this.getInput('email') ).parent().parent().addClass('has-warning');
                    wasError = true;
                }else{
                    $(this.getInput('email') ).parent().parent().removeClass('has-warning');
                }
                var phone = data.phone.trim();
                if( phone !== '' && Z.validate.phone(phone) === false ){
                    $(this.getInput('phone') ).parent().parent().addClass('has-warning');
                    wasError = true;
                    $.gritter.add({ text: 'Проверьте введённый телефонный номер' });
                }else{
                    $(this.getInput('phone') ).parent().parent().removeClass('has-warning');
                }
                return !wasError;
            },
            data: {

                xid: 'form',
                sendTo: 'api/authorize/setData/',
                sendAs: 'data',
                cls: 'b-reg-list__form',
                items: [
                    {type: 'title', text: 'Профиль'},
                    {id: 'avatar',  type: 'image', text: 'Загрузить', value: context.user.avatar},
                    {id: 'surname', bordered: true, type: 'text', text: 'Фамилия', placeholder: 'Фамилия', value: context.user.surname},
                    {id: 'name', bordered: true, type: 'text', text: 'Имя', placeholder: 'Имя', value: context.user.name},
                    // дата рождения
                    // серия номер паспорта - 4 состояние. никакое, серое, зелёное, красное -> collaborate
                    // галочка "ответственность за предоставление некорректных данных"
                    // diff оплаты и фамилии имени
                    {id: 'email', bordered: true, type: 'email', text: 'Ваш e-mail', placeholder: 'Электронная почта', value: context.user.email},
                    {id: 'phone', bordered: true, type: 'phone', text: 'Телефон', placeholder: 'Телефон', value: context.user.phone},
                    {id: 'doubleAuthorize', cls:'check1', type: 'checkbox', text: 'Использовать двойную авторизацию', placeholder: 'Телефон', value: context.user.doubleAuthorize},
                    {type: 'submit', text: 'Изменить'}
                ]
            }
        });
    }
};