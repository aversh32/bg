Z.controller.authorize = {
    tpls: ['form','animatedTabs'],
    init: function(){
        this.route = [];
    },
    router: function(){
        var content = document.getElementById('content');
        content.innerHTML = DOM.tplRenderer('animatedTabs')([
            {text: 'Вход', content: '<div class="form_auth"></div>'},
            {text: 'Регистрация', content: '<div class="form_reg"></div>'},
            {text: 'Восстановление пароля', hidden: true, content: '<div class="form_recover"></div>'}
        ]);

        var resetCode = false;
        var resetForm = widgets.form({
            renderTo: content.querySelector('.form_recover'),
            validate: function(  ){
                $(loginForm.getInput('login') ).parent().parent().removeClass('has-warning');
                var code;
                if( resetCode && (code = $('.approve_code_js' ).find('input' ).val()) && code.length === 4){
                    $('.approve_code_js').removeClass('has-warning');
                }else if(resetCode){
                    $('.approve_code_js').addClass('has-warning');
                    return false;
                }

                return true;
            },
            data: {
                xid: 'form',
                sendTo: 'api/authorize/restore/',
                cls: 'b-tab-slider-list__form',
                items: [
                    {id: 'login', bordered: true, type: 'text', text:
                        '<div style="position: absolute; right: 0">Телефон или e-mail</div>', placeholder: ''},
                    {id: 'code', type: 'hidden'},
                    {id: 'password', type: 'hidden'},
                    {type: 'submit', text: 'Восстановить', cls: 'col-xs-5'}

                ]
            },
            success: function( data ){
                $.gritter.add({
                    text: 'Новый пароль принят системой'
                });
                Z.run.call({data: data.data.session}, 'login');
            },
            error: function( data ){
                if( data === 'code' || data === 'emailCode' ){
                    if( !resetCode ){
                        $.gritter.add({
                            text: 'Код подтверждения был выслан '+(data === 'code'?'в смс':'на ваш email')
                        });
                        $( content.querySelector('.form_recover .col-xs-12') ).hide();
                        resetCode = true;
                        var code = $('<div class="form-group bordered approve_code_js">'+
                            '<label for="code" class="col-xs-3 control-label">Код</label>'+
                            '<div class="col-xs-4"><input type="text" class="form-control" name="code" id="code" placeholder="" value=""></div>'+
                            '<div class="col-xs-5"><button class="form-control" value="">Подтвердить</button></div>'+
                            '</div>').hide();

                        $('.form_recover [name=login]:first').parent().parent().after(code);
                        code.slideDown();
                        code.find('button' ).click( function(){
                            resetForm.edit('code', code.find('input' ).val());
                            resetForm.submit();
                            return false;
                        });
                    }
                }else if( data === 'newPassword' ){
                    $.gritter.add({
                        text: 'Код подтверждения верный.<br>Придумайте новый пароль'
                    });
                    $( content.querySelector('.form_recover .col-xs-12') ).hide();

                    var code = $(
                        '<div class="form-group bordered">'+
                        '<label for="pass1" class="col-xs-3 control-label">Пароль</label>'+
                        '<div class="col-xs-9"><input type="password" class="form-control" name="pass1" id="pass1" placeholder="" value=""></div>'+
                        '</div>'+
                        '<div class="form-group bordered">'+
                        '<label for="pass2" class="col-xs-3 control-label">Подтверждение</label>'+
                        '<div class="col-xs-9"><input type="password" class="form-control" name="pass2" id="pass2" placeholder="" value=""></div>'+
                        '</div>'+
                        '<div class="col-xs-12">'+
                        '<button type="submit" class="btn btn-primary col-xs-7" style="margin-top: 15px;">Сменить пароль</button>'+
                        '</div>'
                    ).hide();

                    $('.form_recover [name=code]:first').parent().parent().slideUp().after(code);
                    code.slideDown();
                    var btn = code.find('button');
                    var pass1 = code.find('input[name=pass1]' ),
                        pass2 = code.find('input[name=pass2]' );
                    pass2.blur(function(){
                        if( pass1.val().trim() !== pass2.val().trim() ){
                            pass2.parent().parent().addClass('has-warning');
                        }
                    } ).on('keyup change', function(){
                        pass2.parent().parent().removeClass('has-warning');
                    });
                    var validatePass = function(  ){
                        if( pass1.val().trim().length < 5 ){
                            $.gritter.add({
                                text: 'Слишком короткий пароль'
                            });
                            return false;
                        }
                        return true;
                    };
                    btn.click( function(){
                        if( !validatePass() ) return;
                        if( pass1.val().trim() === pass2.val().trim() ){
                            resetForm.edit('password', pass1.val().trim());
                        }else
                            pass2.change();

                        resetForm.submit();
                        return false;
                    });
                }else if( data === 'timeout' ){
                    $.gritter.add({
                        text: 'Код авторизации был выслан менее минуты назад'
                    });
                }else if( data === 'wrongLogin' ){
                    $(resetForm.getInput('login') ).parent().parent().addClass('has-warning');
                    $.gritter.add({
                        text: 'Логин не существует'
                    });
                }else if( data === 'wrongCode' ){
                    $('.form_recover .approve_code_js').addClass('has-warning');
                }else{
                    $(resetForm.getInput('login') ).parent().parent().addClass('has-warning');
                }
            }
        });

        var visibleCode = false;
        var loginForm = widgets.form({
            renderTo: content.querySelector('.form_auth'),
            validate: function(  ){
                $(loginForm.getInput('login') ).parent().parent().removeClass('has-warning');
                $(loginForm.getInput('password') ).parent().parent().removeClass('has-warning');
                var code;
                if( visibleCode && (code = $('.approve_code_js' ).find('input' ).val()) && code.length === 4){
                    $('.approve_code_js').removeClass('has-warning');
                }else if(visibleCode){
                    $('.approve_code_js').addClass('has-warning');
                    return false;
                }

                return true;
            },
            data: {
                xid: 'form',
                sendTo: 'api/authorize/login/',
                cls: 'b-tab-slider-list__form',
                items: [
                    {id: 'login', bordered: true, type: 'email', text: 'Ваш e-mail', placeholder: 'Email'},
                    {id: 'password', bordered: true, type: 'password', text: 'Пароль', placeholder:'Password'},
                    {id: 'remember', type: 'checkbox', checked: true, text: 'Запомнить меня'},
                    {id: 'code', type: 'hidden'},

                    {type: 'submit', text: 'Войти'},
                    {type: 'label', text: '<div style="clear: both;padding:1em"></div><span id="pass_recovery" class="link">Восстановить пароль</span>'}

                ]
            },
            success: function( data ){
                Z.run.call({data: data.data}, 'login');
            },
            error: function( data ){
                if( data === 'code' ){
                    if( !visibleCode ){
                        $( content.querySelector('.form_auth .col-xs-12') ).hide();
                        visibleCode = true;
                        var code = $('<div class="form-group bordered approve_code_js">'+
                            '<label for="code" class="col-xs-3 control-label">Код</label>'+
                            '<div class="col-xs-4"><input type="text" class="form-control" id="code" placeholder="" value=""></div>'+
                            '<div class="col-xs-5"><button class="form-control" value="">Подтвердить</button></div>'+
                            '</div>').hide();

                        $('[name=password]:first').parent().parent().after(code);
                        code.slideDown();
                        code.find('button' ).click( function(){
                            loginForm.edit('code', code.find('input' ).val());
                            loginForm.submit();
                            return false;
                        });
                    }
                }else if( data === 'wrongLogin' ){
                    $(loginForm.getInput('login') ).parent().parent().addClass('has-warning');
                    $.gritter.add({
                            text: 'Логин не существует'
                        });
                }else if( data === 'wrongPassword' ){
                    $(loginForm.getInput('password') ).parent().parent().addClass('has-warning');
                    $.gritter.add({
                            text: 'Что-то не так с паролём'
                        });
                }else if( data === 'wrongCode' ){
                    $('.approve_code_js').addClass('has-warning');
                }else{
                    $(loginForm.getInput('login') ).parent().parent().addClass('has-warning');
                    $(loginForm.getInput('password') ).parent().parent().addClass('has-warning');
                }
            }
        });
        widgets.form({
            renderTo: content.querySelector('.form_reg'),

            validate: function( data ){
                var wasError = false;
                if(!data.agree){
                    $(this.getInput('agree') ).parent().parent().addClass('alert alert-danger');
                    wasError = true;
                }
                if(data.login.length<5){
                    $(this.getInput('login') ).parent().parent().addClass('has-warning');
                    wasError = true;
                }
                if(data.password.length<4){
                    $(this.getInput('password') ).parent().parent().addClass('has-warning');
                    wasError = true;
                }
                return !wasError;
            },
            success: function( data ){
                Z.run.call({data: data.data}, 'login');
            }, 
            data: {
                state: 'register',
                xid: 'form',
                sendTo: 'api/authorize/register/',
                sendAs: 'data',
                cls: 'b-tab-slider-list__form',
                items: [
                    {id: 'login', bordered: true, type: 'email', text: 'Ваш e-mail', placeholder: 'Email'},
                    {id: 'password', bordered: true, type: 'password', text: 'Пароль', placeholder:'Password'},
                    {id: 'agree', type: 'checkbox', text: 'Я прочел и согласен с лицензионным соглашением', description: 'Перед использованием ознакомьтесь <br> с <a href="/offer.pdf" target="_blank">лицензионным соглашением</a>'},
                    {type: 'submit', text: 'Далее'}
                ]
            }
        });

        var slider = window.widgets.regSlider();
        slider.on('slideTo', function( num ){
            $(this.a.get(2))[num === 2 ? 'show' : 'hide']();
        });
        $('#pass_recovery' ).click( function(  ){
            slider.slideTo(2);
        });
    }
};