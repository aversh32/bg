Z.smsStatusMap = {
    12: 'Доставлено',
    0: 'Добавлено в очередь',
    1: 'В очереди',
    18: 'Отказ в передаче',
    13: 'Просрочено',
    15: 'Не доставлено'
};
Z.controller.projects = {
    tpls: [
        'projStat',
        'tarif',
        'apiKeyInfo',
        'autoComplete',
        'messageLog',
        'projectMenuItem',
        'menuList',
        'projectItem',
        'list',
        'standardLayout',
        'tabs',
        'form',
        'senderItem',
        'prefixList',
        'deliveryLayout',
        'deliveryManual',
        'deliveryItem',
        'deliveryMessage',
        'userDropDown',
        'projectPrefixAdd',
        'projectRequestAdd',
        'projectRequestTest',
        'roleItem',
        'rightUserAdd',
        'requestItem',
        'mfo'
    ],
    init: function(){
        this.currentActive = null;
        this.getLists();
        Z.storage.load('contactLists');
    },
    idKey: 'id',
    getLists: function(  ){
        Z.storage.load('projects', function( storage ){
            this.storage = storage;
            this.fire('listsLoaded');
        }.bind(this));
    },
    updateMenu: function(  ){
        var subMenu = document.getElementById('subMenu');
        var controller = this;
        $(subMenu).stop().css({'left':'0px','margin-right':'0px'} ).show();

        this.list = widgets.list({
            renderTo: subMenu,
            canRemove: false,
            title: 'ПРОЕКТЫ',
            canAdd: true,
            canEdit: false,
            items: Z.clone(this.storage.data, true ).map( function( el ){
                if( el.avatar === 'undefined' )
                    el.avatar = '';
                return el;
            }),
            itemTpl: 'projectMenuItem',
            listSelector: '.js_list',

            tpl: 'menuList',
            idKey: this.idKey,
            addButton: 'Добавить проект',
            newItem: 'Новый проект',
            addLink: '/#/projects/new',
            listeners: {
                addButton: function(  ){

                   /* var c, name = this.newItem;
                    while( (name in controller.namesHash) ){
                        c = (c||1)+1;
                        name = this.newItem + ' '+ c;
                    }

                    var obj = {name:name};
                    Z.query('project','create', {data: obj}, function( data ){
                        obj.id = data.data;
                        controller.hash[obj[this.idKey]] = obj;
                        controller.namesHash[obj.name] = obj;
                        this.add(obj);
                        this.fire('action.edit', obj.id, this.itemMap[obj.id]);
                    }.bind(this));*/
                }
            }
        });
    },
    listeners: {
        listsLoaded: function(  ){
            this.updateMenu();
            this.listLoaded = true;
            this.navigate();
        },
        titleEdit: function( name ){
            var item = this.storage.get('id', this.currentActive)[0];
            this.storage.edit( item, {name: name});

            Z.query('project','edit', {data: {id: item.id, name: item.name}});
        },
        tabChange: function( names ){
            var hash = names.join(':')+':'+this.currentActive;
            if( hash !== this.lastTab ){
                this.lastTab = hash;
                this.currentTab = names[0];
                var tab = this.tabRenderer[names[0] || ''];
                if( tab )
                    tab.call(this, document.getElementById('content'), this.storage && this.currentActive &&  this.storage.get('id', this.currentActive)[0]);
                else
                    $.gritter.add({ text: 'Раздел не существует' });
            }
        }
    },
    tabRenderer: {
        'new': function( el ){
            var lastData, self = this;
            var form = widgets.form({
                renderTo: el,
                validate: function( data ){
                    lastData = data;
                    return data.name.length > 0;
                },
                error: function( data ){

                },
                success: function( data ){
                    lastData.id = data.data;
                    Z.storage.projects.add( Z.clone(lastData));
                    self.list.add(lastData);
                    document.location.hash = '/projects/'+data.data+'/';

                },
                data: {
                    change: function( id, val ){


                    },
                    cls: 'b-main__container b-main__container_centered b-main__container_spacer',
                    xid: 'form',
                    sendAs: 'data',
                    sendTo: 'api/project/create/',
                    items: [
                        {id: 'avatar', type: 'image', cls: 'center-image-upload btn-load', justImage: true},
                        {id: 'name', pencil: true, type: 'text', placeholder: 'Название проекта', customInputCls: 'form-control bd0',groupCls: 'b-page-line input-group transperent col-xs-10 b-company__name'},
                 //       {id: 'company',  type: 'company', text: 'Выберите компанию:'},
                        {type: 'submit', text: 'Создать новый', cls: 'btn_next-step', just: true}
                    ]}
            });
            form.getInput('name').focus();
        },
        mfo: function (el, item) {
            var mnu = this;
            item = this.storage.get('id', this.currentActive)[0];
            var projectItem = item,
            route = this.route,
            pid = this.currentActive;
            if( !item.mfo || !item.mfo.approved ){
                el.innerHTML = '<DIV style="font-size:34px;background: #fff;padding: 70px 0 100px"><center>' +
                    '<img width="100%" src="http://billingrad.com/bg-site/img/slides/logo-pic.jpg"><br><br>' +
                    'Billingrad &mdash; лучшее решение для проведения микрофинансовых операций.<br>' +
                (item.mfo && item.mfo.requested?'Заявка на одобрение мфо находится на одобрении, но вы всё равно можете <a href="/#/about/">связаться с нами</a>!'
                    :'Для одобрения проекта <a href="/#/about/">свяжитесь с нами,</a> ' +
                'или <input type="button" class="btn btn-primary" value="отправьте заявку">.') +
                '</center></DIV>';
                $(el ).find('input[type=button]' ).click( function(  ){
                    Z.query('project','requestAbility',{pid: pid, type:'mfo'}, function( res ){
                        item.mfo = {requested: true};
                        Z.controller.projects.tabRenderer.mfo.call(mnu,el, item);
                    });
                });
                return false;
            }

            Z.query('mfo', 'balance', {pid: item.id}, function (list) {
                list && list.data && (list = list.data);
                el.innerHTML = DOM.tplRenderer('mfo_main')({
                    account: list
                });
                //el.innerHTML += JSON.stringify(item,null,2).replace(/\n/g,'<br>').replace(/\s/g,'&nbsp;');
                var $el = $(el),
                    create = $el.find('.action[data-act=new-mfo-transaction]');

                create.click(function () {

                    var form = $('.mfo-new-transaction_form'),
                        name = form.find('.new-mfo-transaction_name'),
                        submit = form.find('.new-mfo-transaction_submit');
                    form.slideDown();

                    name.val('Перевод '+ dateTimeFormatter(+new Date()));
                    submit.click(function () {
                        submit.attr('disabled','disabled');
                        Z.query('mfo', 'create', {name: name.val().trim(), pid: item.id}, function (data) {
                            if(data.error)
                                return console.log('error creating list');

                            var num = form.find('input.new-mfo-transaction_number').val(),
                                amount = form.find('.new-mfo-transaction_amount').val()*100,
                                accountId = form.find('.new-mfo-transaction_select-account').val();
                            Z.query('mfo', 'transaction', {
                                pid: item.id,
                                lid: data.data,
                                aid: accountId,
                                to: num,
                                type: 'card',
                                amount: amount
                            }, function (data) {
                                Z.query('mfo', 'proceed', {tid: data.data}, function () {
                                    alert('Транзакция добавена в очередь');
                                    form.slideUp();
                                    form.find('input.new-mfo-transaction_number').val('');
                                    form.find('.new-mfo-transaction_amount').val('0');
                                    //debugger;
                                });
                            });
                        });
                    });
                });

            });
        },
        mc: function (el, item) {
            el.innerHTML += JSON.stringify(item,null,2).replace(/\n/g,'<br>').replace(/\s/g,'&nbsp;');
            var mnu = this;
            item = this.storage.get('id', this.currentActive)[0];
            var projectItem = item,
            route = this.route,
            pid = this.currentActive;
            if( !item.mc || !item.mc.approved ){
                el.innerHTML = '<DIV style="font-size:34px;background: #fff;padding: 70px 0 100px"><center>' +
                    '<img width="100%" src="http://billingrad.com/bg-site/img/slides/logo-pic.jpg"><br><br>' +
                    'Billingrad &mdash; лучшее решение для организации мобильной коммерции.<br>' +
                (item.mc && item.mc.requested?'Заявка на одобрение МК находится на одобрении, но вы всё равно можете <a href="/#/about/">связаться с нами</a>!'
                    :'Для одобрения проекта <a href="/#/about/">свяжитесь с нами,</a> ' +
                'или <input type="button" class="btn btn-primary" value="отправьте заявку">.') +
                '</center></DIV>';
                $(el ).find('input[type=button]' ).click( function(  ){
                    Z.query('project','requestAbility',{pid: pid, type:'mc'}, function( res ){
                        item.mc = {requested: true};
                        Z.controller.projects.tabRenderer.mc.call(mnu,el, item);
                    });
                });
                return false;
            }
            var html = ['<h3>Мобильная коммерция</h3>'];
            html.push('<span class="action accordion active" data-block="mc-status" data-active="true">Статистика</span> | ');
            html.push('<span class="action accordion" data-block="mc-pay">Выставить счёт</span> | ');
            html.push('<span class="action accordion" data-block="mc-settings">Настройки</span>');


            html.push('<div class="mc-settings">' +
                    'Секретный ключ шлюза <input class="secret-key" type="text" value=""> <input class="secret-save" type="button" value="Сохранить"><br>' +
                    '<div>Для настройки URL на который будут падать уведоления об изменении статуса - перейдите в настройки проекта в раздел "Настройка уведомлений" и добавьте оповещение на событие "mc".</div>'+
                '</div>');

            html.push('<div class="mc-pay">' +
                '</div>');

            html.push('<div class="mc-status">' +
                '</div>');


            el.innerHTML = html.join('\n');
            var titles = $(el).find('.accordion'),
                activate = function(){
                    titles.each(function(i, el){
                        return $('.'+el.getAttribute('data-block'))[ el.getAttribute('data-active') === 'true' ? 'show' : 'hide']();
                    });
                };
            activate();
            titles.click(function(){
                titles.attr('data-active', 'false');
                titles.removeClass('active');
                $(this).attr('data-active', 'true').addClass('active');

                activate();
            });



            Z.query('project','box', {pid: pid, type: 'bill_4pay'}, function(data){
                if(data.error)
                    return false;
                $('.secret-key').val(data.data && data.data.secret || '');
            });
            $('.secret-save').click(function(){
                Z.query('project','box', {pid: pid, type: 'bill_4pay', data: {
                    secret: $('.secret-key').val()
                }}, function(){
                    $.gritter.add({
                        title: 'Изменения сохранены',
                        text: 'Данные были успешно сохранены'
                    });
                });
            });
            widgets.form({
                renderTo: $('.mc-pay')[0],
                success: function( data ){
                    $.gritter.add({
                        //title: 'Изменения сохранены',
                        text: 'Выставленный счёт принят в обработку'
                    });
                },
                validate: function( data ){
                    var wasError = false;
                    var phone = data.payer.trim();
                    if( phone !== '' && Z.validate.phone(phone) === false ){
                        $(this.getInput('payer') ).parent().parent().addClass('has-warning');
                        wasError = true;
                        $.gritter.add({ text: 'Проверьте введённый телефонный номер' });
                    }else{
                        $(this.getInput('payer') ).parent().parent().removeClass('has-warning');
                    }
                    var amount = data.amount.replace(/,/g,'.'),
                        wrong = amount.match(/[^0-9\.]/g);
                    amount = parseFloat(amount);

                    if( wrong !== null ){
                        $(this.getInput('amount') ).parent().parent().addClass('has-warning');
                        wasError = true;
                        $.gritter.add({ text: 'В сумме найдены некорректные символы: '+ wrong.join(', ') });
                    }else if(!isNaN(amount) && amount < 10){
                        $(this.getInput('amount') ).parent().parent().addClass('has-warning');
                        wasError = true;
                        $.gritter.add({ text: 'Сумма меньше 10 рублей' });
                    }else if(!isNaN(amount) && amount > 1000){
                        $(this.getInput('amount') ).parent().parent().addClass('has-warning');
                        wasError = true;
                        $.gritter.add({ text: 'Сумма больше 1000 рублей' });
                    }else{
                        $(this.getInput('amount') ).parent().parent().removeClass('has-warning');
                    }
                    if(!wasError)
                        data.amount = (amount * 100)|0;
                    return !wasError;
                },
                data: {

                    xid: 'form',
                    sendTo: 'api/bill/create',
                    //sendAs: 'data',
                    cls: 'b-reg-list__form',
                    items: [
                        {id: 'gate', type: 'hidden', value: '4pay'},
                        {id: 'type', type: 'hidden', value: 'mc'},
                        {id: 'pid', type: 'hidden', value: this.currentActive},
                        {id: 'payer', bordered: true, type: 'phone', text: 'Телефон', placeholder: 'Телефон', value: ''},
                        {id: 'amount', bordered: true, type: 'text', text: 'Сумма', placeholder: 'Сумма', value: '10'},
                        {type: 'submit', text: 'Выставить счёт'}
                    ]
                }
            });

        },
        mcOld: function (el, item) {


            el.innerHTML += JSON.stringify(item,null,2).replace(/\n/g,'<br>').replace(/\s/g,'&nbsp;');
            var mnu = this;
            item = this.storage.get('id', this.currentActive)[0];
            var projectItem = item,
            route = this.route,
            pid = this.currentActive;
            if( !item.mc || !item.mc.approved ){
                el.innerHTML = '<DIV style="font-size:34px;background: #fff;padding: 70px 0 100px"><center>' +
                    '<img width="100%" src="http://billingrad.com/bg-site/img/slides/logo-pic.jpg"><br><br>' +
                    'Billingrad &mdash; лучшее решение для организации мобильной коммерции.<br>' +
                (item.mc && item.mc.requested?'Заявка на одобрение МК находится на одобрении, но вы всё равно можете <a href="/#/about/">связаться с нами</a>!'
                    :'Для одобрения проекта <a href="/#/about/">свяжитесь с нами,</a> ' +
                'или <input type="button" class="btn btn-primary" value="отправьте заявку">.') +
                '</center></DIV>';
                $(el ).find('input[type=button]' ).click( function(  ){
                    Z.query('project','requestAbility',{pid: pid, type:'mc'}, function( res ){
                        item.mc = {requested: true};
                        Z.controller.projects.tabRenderer.mc.call(mnu,el, item);
                    });
                });
                return false;
            }

            var lastRand = item.id.split('').reduce(function(a,b){return ((a+b.charCodeAt(0))*214013+2531011)%(2<<15)},4);
            var rand = function (a,b) {
                lastRand = ((lastRand * 214013 + 2531011) % (2<<15));
                return a+lastRand % (b-a)
            };
            el.innerHTML = '<h3>Мобильная коммерция</h3>';
            var fake = [];
            Z.query('def','list',{}, function (data) {
                var list = data.data.filter(function (el) {
                    return !el.zone && !el.country;
                });
                var randomOp = function () {
                    var sum_of_weight = 0;
                    for(var i=0; i<list.length; i++) {
                       sum_of_weight += list[i].count;
                    }
                    var rnd = (rand(0,65536)*rand(0,65536))%sum_of_weight;
                    for(var  i=0; i<list.length; i++) {
                      if(rnd < list[i].count)
                        return list[i];
                      rnd -= list[i].count;
                    }
                    return list[0];
                };
                var short = {
'5552':99.99,
'5554':50.00,
'5558':60.00,
'5601':1.99,
'5767':50.00,
'6078':170.00,
'6091':40.00,
'6095':100.01,
'6100':1.70,
'6101':25.00,
'6673':100.01,
'6719': 148.31,
'6750':90.00,
'6788':1.36,
'7019':88.88,
'7495':130.00,
'7602':1.70,
'7780':9.99,
'7859':90.00,
'7877':1.70,
'8151':100.01,
'8191':20.00,
'8235':15.00,
'8619':50.00,
'8621':200.00,
'8650':[1.01, 3.00, 5.00, 8.00, 10.01, 15.00, 20.00, 30.00],
'8776':22.00,
'8870':17.00,
'8930':[20.00, 30.00],
'9127': 5.00,
'9128': 20.00,
'9135': 20.00,
'9136':50.00,
'9144':[0.35, 1.01, 20.00],
'9151':135.00,
'9173':100.01,
'9175':1.70,
'9179':80.0,
'9180':[10.01, 20.00, 30.00],
'9191':170.00};
                var s = [];
                for(i in short)
                    s.push({phone:i, price: short[i]});
                for(var i = 0,_i = rand(51,560); i < _i; i++){
                    var pay = s[rand(0, s.length)];
                    fake.push({
                        op: randomOp().name,
                        phone: pay.phone,
                        amount: pay.price
                    });
                }

                var hash = {};
                var r = function (el) {
                    return el.length ? el[rand(0,el.length)]:el;
                };
                fake.forEach(function (el) {
                    if(!hash[el.op])
                        hash[el.op] = {ok:0,fail:0,approve:0, el:el};
                    if(rand(0,36)<32)
                        return hash[el.op].ok+=r(el.amount);
                    if(rand(0,36)<32)
                        return hash[el.op][rand(0,2)<1?'approve':'fail']+=r(el.amount);
                });
                var draw = [];
                for(i in hash)
                    draw.push(hash[i]);

                draw.sort(function (a,b) {
                    return (b.ok - a.ok)+(b.fail - a.fail);
                });
                var html = '';
                draw.forEach(function (el) {
                    html += '<tr class="mk-item"><td class="op1"><span>&#9658;</span><span class="action">'+el.el.op+'</span></td><td>'+el.ok.toFixed(2)+'</td><td>'+el.fail.toFixed(2)+'</td><td>'+el.approve.toFixed(2)+'</td></tr>'
                });

                el.innerHTML = '<h3>Мобильная коммерция | отчёт</h3>' +
                '<h4>сегодня | <span class="action">вчера</span> | с начала месяца | интервал</h4>' +
                '<h4>Отчёт за 9 июня 2015</h4>'+
                    '<table>'+
                    '<tr style="font-size: 110%;font-weight: bold"><td style="width: 60%;">Оператор</td><td style="width: 15%;">Получено</td><td style="width: 15%;">Отклонено</td><td>Hold</td></tr>'+
                    html+
                    '<tr style="font-size: 110%"><td style="text-align: right;padding-right: 16px;">Итог</td><td>'+
                (function () {

                    var sum = draw.reduce(function (a, b) {
                        a.ok += b.ok;
                        a.fail += b.fail;
                        a.approve += b.approve;
                        return a;
                    }, {ok: 0, fail: 0, approve: 0});
                    return sum.ok.toFixed(2)+'</td><td>'+sum.fail.toFixed(2)+'</td><td>'+sum.approve.toFixed(2);
                })()+
                    '</td></tr>'+
                    '</table>';
                var p = $(el);
                $(el).find('tr td.op1').click(function () {
                    var el = this;
                    if(!$(el).find('.detail')[0]){
                        var item = draw[p.find('tr td.op1').index(el)];
                        $(el).append('<div class="detail" style="display:none;padding-left:20px">'+
                            fake.filter(function (el) {
                                return el.op === item.el.op;
                            }).map(function (el) {
                                return '<div>'+el.phone+': '+(el.amount.length ? el.amount[0]:el.amount)+'</div>'
                            }).join('')
                        +'</div>');
                    }
                    $(el).find('.detail').slideToggle(function () {
                        $(el).find('span')[0].innerHTML = this.style.display==='none' ? '&#9658;':'&#9660';
                    });

                    //;
                });
                //console.log(fake)
            });


        },
        settings: function( el, item ){

            el.innerHTML = DOM.tplRenderer('standardLayout')({
                name: item.name,
                canDelete: false
            });
            //var content = el.querySelector('.js_content');
            el.querySelector('.js_content' ).appendChild(
                $('<div><DIV class="api_key">' +
                    'Получить ключ доступа к API' +
                    '</DIV>' +
                    '<div class="hidden api_data"></div></div>')[0]
            );
            var keyLoaded = false;
            DOM.addListener(el.querySelector('.api_key'),'click', function(  ){
                $(el.querySelector('.api_data') ).toggleClass('hidden');
                !keyLoaded &&
                    Z.query('serial', 'get', {instance: item.id}, function( data ){
                        el.querySelector('.api_data' ).innerHTML = DOM.tplRenderer('apiKeyInfo')(data.data);
                    });
                keyLoaded = true;
            });


            var senderList = (item.sender || [])
                .filter(function(el){return el.approved===true;} )
                .map(function (el) {
                    return el.sender?{id: el.sender, name: el.sender}:el
                });

            if( senderList.length > 0 ){
                if(!item.serviceSender)
                    senderList.unshift({id: '', name: 'Billingrad'})

                el.querySelector('.js_content' ).appendChild(
                    $('<div class="h4">' +
                        'Отправитель сервисных сообщений ' +
                        '<SELECT id="serviceSenderSelect">'+
                            senderList.map(function (el) {
                                return'<OPTION value="'+el.id+'">'+el.name+'</OPTION>'
                            }).join('\n')+
                        '</SELECT> ' +
                        '<input type="button" value="Сохранить" id="senderSave">')[0]
                );
                $('#serviceSenderSelect').val(item.serviceSender || '');
                document.getElementById('senderSave').addEventListener('click', function () {
                    Z.query('project','edit', {data: {id: item.id, serviceSender: $('#serviceSenderSelect').val()}});
                });
            }





            var access = document.createElement('div');
            el.querySelector('.js_content' ).appendChild(access);

            ///var serviceMsgCfg = document.createElement('div');
            //el.querySelector('.js_content' ).appendChild(serviceMsgCfg);


            var draw = function () {


                Z.query('access', 'can', {
                    uid: Z.user.data._id,
                    instance: item.id,
                    type: 'project', action: 'project.access'
                }, function (data) {
                    var typeMap = {
                            system: 1,
                            project: 2,
                            wallet: 3,
                            company: 4
                        },
                        typeMapHash = {1: 'system', 2: 'project', 3: 'wallet', 4: 'company'};
                    if (!data || !data.data)
                        return;
                    var list,
                        roles,
                        right;
                    Z.doAfter(function (cb) {
                        Z.query('access', 'list', {iid: item.id, type: 'project'}, function (data) {
                            list = data.data;
                            cb();
                        });
                    }, function (cb) {
                        Z.query('access', 'getRoles', {}, function (data) {
                            roles = data.data;
                            cb();
                        });
                    }, function (cb) {
                        Z.query('access', 'getRights', {}, function (data) {
                            right = data.data;
                            cb();
                        });
                    }, function () {

                        var rHash = Z.makeHash(Z.map(roles, function (k, val) {
                            return val
                        }), 'rid');
                        var data = [],
                            dH = {};
                        list.forEach(function (el) {
                            var block;
                            if (!(block = dH[el.uid])) {
                                data.push(block = dH[el.uid] = Z.clone(el.user));
                                if(el.uid === Z.user.data._id)
                                    block.me = true;
                                block.roles = {};
                            }
                            block.roles[el.rid] = {
                                name: rHash[el.rid].name,
                                rights: right[el.rid]
                            };
                        });
                        console.log("Права хэш " + rHash);
                        console.log("Права   "+right);
                        var roleList = widgets.list({
                            renderTo: access,
                            title: 'Команда',
                            canAdd: true,
                            items: data || [],
                            itemTpl: 'roleItem',
                            listSelector: '.js_list',
                            tpl: 'prefixList',
                            idKey: '_id',
                            addButton: 'Добавить пользователя',
                            newItem: 'user',
                            listeners: {
                                addButton: function () {
                                    var addBtn = $(this.els.js_add_button);
                                    var els = document.createElement('div');
                                    els.innerHTML = DOM.tplRenderer('rightUserAdd')({});

                                    addBtn.before(
                                        els
                                    );
                                    addBtn.hide();
                                    var last, timer, current = false,
                                        gList;
                                    var debounce = function (val) {
                                        if (last === val || val.trim().length < 2)
                                            return;
                                        last = val;
                                        clearTimeout(timer);
                                        drop.hide();
                                        current = false;
                                        timer = setTimeout(function () {
                                            Z.query('authorize', 'find', {name: val}, function (data) {
                                                var list = data.data;
                                                if (list && list.length) {
                                                    gList = list;
                                                    drop[0].innerHTML = DOM.tplRenderer('userDropDown')({list: list});
                                                    drop.show();
                                                }
                                            });
                                        }, 200);
                                    };
                                    var addAction = function () {
                                        var val = input.val().trim().toLowerCase();
                                        Z.query('authorize', 'find', {name: val}, function (data) {
                                            var list = data.data;
                                            if (list.length) {
                                                Z.query('access', 'grant', {
                                                    uid: list[0]._id,
                                                    iid: item.id,
                                                    type: 'project',
                                                    role: 'viewer'
                                                }, function () {
                                                    draw();
                                                });
                                            } else {
                                                $.gritter.add({
                                                    text: 'Пользователь не найден!'
                                                });
                                                addBtn.hide();
                                                addBtn.before(
                                                    els
                                                );
                                                input.focus();
                                            }
                                        });
                                        cancel.click();
                                    };
                                    var input = $(els).find('input').on('change keyup mouseup keypress', function (e) {
                                            if (e && e.which) {

                                                if (e.which === 38 || e.which === 40) {
                                                    if (current !== false)
                                                        var last = $(drop.find('.dropdown_item')[current]);

                                                    if (e.which === 38) {
                                                        if (current === false) {
                                                            current = gList.length - 1;
                                                        } else {
                                                            current = current === 0 ? gList.length - 1 : current - 1;
                                                        }
                                                    } else if (e.which === 40) {
                                                        if (current === false) {
                                                            current = 0;
                                                        } else {
                                                            current = current === gList.length - 1 ? 0 : current + 1;
                                                        }
                                                    }
                                                    last && last.removeClass('active');
                                                    $(drop.find('.dropdown_item')[current]).addClass('active');
                                                    return false;
                                                } else if (e.which === 13) {
                                                    if (current !== false) {
                                                        input.val(e.target.innerHTML.trim());
                                                        addAction();
                                                    }
                                                }
                                            }
                                            debounce(input.val());
                                        }).focus(),

                                        add = $(els).find('js_btn_add').click(function () {
                                            addAction();
                                        }),
                                        cancel = $(els).find('js_btn_cancel').click(function (e) {
                                            e.preventDefault();
                                            setTimeout(function () {
                                                addBtn.show();
                                                $(els).remove();
                                            }, 1);
                                        }),
                                        drop = $(els).find('.js_dropdown').click(function (e) {
                                            var el = $(e.target);
                                            if (el.hasClass('dropdown_item')) {
                                                current = el.index();
                                                input.val(el.html().trim());
                                                addAction();
                                            }
                                        });
                                }
                            }
                        });
                        roleList.on('action.addrole', function (id, el, e) {

                            var t = $(e.target),
                                div = document.createElement('div');


                            var avaliable = Z.map(roles,function(el){return el})
                                .filter(function(el){
                                    return el.indexOf('#')===-1 && 'user,team,creator,wallet,bill'.split(',').indexOf(el)===-1;
                                }).filter(function (el) {
                                    return !dH[id].roles[roles[el].rid];
                                });
                            div.innerHTML = '<select>'+
                                avaliable.map(function (el) {
                                        return '<option value="'+el+'">'+el+'</option>'
                                    }).join('')+
                            '</select><button class="btn btn-default js_btn_add">Добавить</button>'+
                            '<button class="btn btn-cancel js_btn_cancel">Отменить</button>';
                            if( !avaliable.length )
                                return t.hide();
                            t.after(div)
                            t.hide();
                            $(div).find('.js_btn_add').click(function () {
                                Z.query('access', 'grant', {
                                    uid: id,
                                    iid: item.id,
                                    type: 'project',
                                    role: $(div).find('select').val()
                                }, function () {
                                    draw();
                                });
                                $(div).hide();
                                draw();
                            });
                            $(div).find('.js_btn_cancel').click(function () {
                                $(div).remove();
                                t.show();
                            });
                        });
                        /*roleList.on('action.remove', function (id, b, c) {
                            if (confirm(
                                    'Вы уверены что хотите удалить доступ пользователю «' +
                                    id +
                                    '»?'
                                )) {

                                Z.query('project', 'removeSender', {id: item.id, sender: id});
                                this.remove([id]);
                            }
                        });*/
                        roleList.on('action.toggle', function (id, el, c) {
                            $(c.target).next().toggle();
                        });
                        roleList.on('action.more', function (id, el, c) {
                            if (!c.target.expanded) {
                                c.target.expanded = true;
                                var name = c.target.innerHTML.trim();

                                var data = right[roles[name].rid];
                                var out = data.map(function (el) {
                                    return '<div class="role_right role_right' + (el.type == 1 ? '_group action js_btn_more' : '_item') + '">' +
                                        el.action +
                                        '</div>'
                                }).join('');
                                var div = document.createElement('div');
                                div.className = 'role_details right_info';
                                div.innerHTML = out;

                                $(c.target).after(div);
                            }
                            $(c.target).next().toggle();
                        });

                    })

                });
            };
            draw();

            var senders = document.createElement('div');
            el.querySelector('.js_content' ).appendChild(senders);



            var o = {};
            for( var i in navigator )
                if( navigator.hasOwnProperty(i) && (
                    {string:1,number:1}[typeof navigator[i]] || i === 'languages'))
                        o[i] = navigator[i];
            var agreeData = {
                type: 'sender',
                data: {
                    type: 'add sender',
                    nav: o,
                    screen: screen,
                    pid: item.id
                }
            };
            var agreed = false;
            Z.query('agree','list', {type: 'sender'}, function( list ){
                agreed = !!list.data.filter(function(el){
                    return el.type === 'sender';
                }).filter(function(el){
                    var data = {};

                    try{
                        data = JSON.parse(el.data)
                    }catch(e){}
                    return data.pid===item.id;
                } ).length;
            });

            var sendersList = widgets.list({
                renderTo: senders,
                title: 'Одобрение имени отправителя',
                canAdd: true,
                items: item.sender || (item.sender = []),
                itemTpl: 'senderItem',
                listSelector: '.js_list',
                tpl: 'prefixList',
                idKey: 'sender',
                addButton: 'Добавить префикс',
                newItem: 'prefix',
                listeners: {
                    addButton: function(  ){
                        var addBtn = $(this.els.js_add_button);
                        var els = document.createElement('div');
                        els.innerHTML = DOM.tplRenderer('projectPrefixAdd')({})

                        addBtn.before(
                            els
                        );
                        addBtn.hide();

                        //

                        var next = function(){
                            var rule = function( name ){
                                $( els ).find( '.rule.js_' + name ).addClass( 'ruleError' );
                            };
                            $( els ).find( 'input' ).focus().keydown( function( e ){
                                $( els ).find( '.rule' ).removeClass( 'ruleError' );
                                var code = e.keyCode ? e.keyCode : e.which;
                                if( code === 13 || code === 10 ){
                                    addClick();
                                    return false;

                                }

                            } ).keypress( function( e ){
                                var char = String.fromCharCode( (e.keyCode ? e.keyCode : e.which) );

                                if( char.match( /[ a-zA-Z0-9\.\-@\+\*\\]/ ) === null ){
                                    rule( 'symbol' );
                                    return false;
                                }
                                if( this.value.length === 11 && (
                                    char.match( /[^0-9]/ ) !== null ||
                                    this.value.match( /[^0-9]/ ) !== null
                                    ) ){
                                    rule( 'length' );
                                    return false;
                                }
                                if( this.value.length === 12 ){
                                    rule( 'length' );
                                    return false;
                                }
                                //if( e.which.ma)
                            } );
                            $( els ).find( '.js_btn_cancel' ).click( function(){
                                $( els ).remove();
                                addBtn.show();
                            } );
                            var self = this;
                            var addClick = function(){
                                $( els ).remove();
                                addBtn.show();
                                var prefix = $( els ).find( 'input[type=text]' ).val().trim();

                                if( (item.sender || []).filter( function( el ){
                                        return el.sender === prefix;
                                    } ).length ){
                                    $.gritter.add( {text: 'Префикс уже существует!'} );
                                    return;
                                }

                                var obj = {sender: prefix, approved: false};
                                self.add( obj );
                                Z.query( 'project', 'addSender', {id: item.id, sender: prefix} )
                            };
                            $( els ).find( '.js_btn_add' ).click( addClick );
                        }.bind(this);
                        if(agreed){
                            $(els ).find('.agreement' ).hide();
                            $(els ).find('.other').show();
                            next();
                        }else{
                            $(els ).find('.agreement' ).show();
                            $(els ).find('.other').hide();
                            $(els ).find('.js_btn_yaya' ).click( function(  ){
                                if($(els ).find('input[name=agreement]:checked' ).length){
                                    Z.query('agree','add', agreeData, function(  ){
                                        $(els ).find('.agreement' ).hide();
                                        $(els ).find('.other').show();
                                        next();
                                    });
                                }else{
                                    alert('Требуется согласие')
                                }
                            });
                        }
                    }
                }
            });
            sendersList.on('action.remove', function(id,b,c){
                if( confirm(
                            'Вы уверены что хотите удалить отправителя «'+
                            id +
                            '»?'
                        ) ){

                        Z.query('project','removeSender',{id: item.id, sender: id});
                        this.remove([id]);
                    }
            });


            var request = document.createElement('div');
            el.querySelector('.js_content' ).appendChild(request);
            var requestList = widgets.list({
                renderTo: request,
                title: 'Настройка уведомлений',
                canAdd: true,
                items: item.request || (item.request = []),
                itemTpl: 'requestItem',
                listSelector: '.js_list',
                tpl: 'prefixList',
                idKey: 'type',
                addButton: 'Добавить запрос',
                newItem: 'prefix',
                listeners: {
                    addButton: function(  ){
                        var addBtn = $(this.els.js_add_button);
                        var els = document.createElement('div');
                        els.innerHTML = DOM.tplRenderer('projectRequestAdd')({o:'{{',c:'}}'})

                        addBtn.before( els );
                        addBtn.hide();
                        $(els ).find('.js_help_toggle' ).click( function(  ){
                            $(els ).find('.js_template_help' ).toggle();
                        });

                        $(els ).find('.js_btn_cancel' ).click( function(  ){
                            $(els).remove();
                            addBtn.show();
                        });
                        var self = this;
                        var addClick = function(  ){
                            $(els ).remove();
                            addBtn.show();
                            var obj = {
                                type: $(els ).find('input[name=type]' ).val().trim(),
                                method: $(els ).find('select[name=method]' ).val(),
                                url: $(els ).find('input[name=url]' ).val().trim(),
                                body: $(els).find('textarea' ).val().trim()
                            };

                            if( obj.type.length < 2 )
                                return $.gritter.add({ text: 'Укажите валидный тип!' });

                            self.add(obj);

                            Z.query('project', 'setResponse', {id: item.id, type: obj.type, response: obj});

                        };
                        $(els ).find('.js_btn_add' ).click( addClick );
                    }
                }
            });
            requestList.on('action.remove', function(id,b,c){
                if( confirm(
                            'Вы уверены что хотите удалить запрос «'+
                            id +
                            '»?'
                        ) ){

                        Z.query('project','removeResponse',{id: item.id, type: id});
                        this.remove([id]);
                    }
            });
            requestList.on('action.test', function(id,el,c){
                var info = this.itemsHash[id];
                var $btn = $(el ).find('.js_btn_test');
                var div = document.createElement('div');
                div.innerHTML = DOM.tplRenderer('projectRequestTest')({
                    id:id,
                    randomId: ((Math.random() * 1000000)|0)+1000,
                    randomStatus: 'fail,success,process'.split(',')[(Math.random()*3)|0]
                });
                $btn.hide().after(div);
                var log = $(div).find('.js_log' );
                var area = $(div).find('textarea' );
                $(div).find('.js_btn_send' ).click( function(){
                    var req;
                    try{
                        req = JSON.parse(area.val());
                    }catch(e){
                        return $.gritter.add({ text: 'Невалидный JSON!' });
                    }
                    var logItemEl = $('<div class="status alert-warning">Запрос к API</div>');
                    log.append(logItemEl);
                    Z.query('test','response', {pid: item.id, type: id, data: req}, function( data ){
                        if( !data.error && typeof data.data === 'object' ){
                            data = data.data;
                            logItemEl.html([
                                'Отправлен '+ data.method +' запрос',
                                'На хост: '+ data.host,
                                'Порт: '+ data.port,
                                'Адрес: '+ data.path,
                                'Тело:',
                                data.body?'<div class="js_pretty_body"></div>':'',
                                'Получен ответ: '+data.status,
                                'Тело ответа:',
                                data.data?'<div class="js_pretty_resp"></div>':'',
                            ].join('<BR>'));
                            Z.widgets.prettyFormatter({
                                renderTo: logItemEl.find('.js_pretty_body')[0],
                                data: data.body
                            });
                            Z.widgets.prettyFormatter({
                                renderTo: logItemEl.find('.js_pretty_resp')[0],
                                data: data.data
                            });
                        }else{
                            $.gritter.add({ text: 'Произошла ошибка: `'+(data && data.data)+'`!' });
                        }
                    })
                })

            });


        },
        about: function( el ){
            var item = this.storage.get('id', this.currentActive)[0];
            el.innerHTML = DOM.tplRenderer('standardLayout')({
                name: '<input class="form-control big js_title_edit" value=""/>',
                canDelete: false
            });

            this.buildTitleInput( el.querySelector('.js_title_edit'), Z.clone(item) );
            var controller = this;
            var lastData;

            widgets.form({
                renderTo: el.querySelector('.js_content'),
                validate: function( data ){
                    lastData = Z.clone(data);

                    return true;
                },
                success: function( data ){
                    var anItem = controller.storage.get('id', controller.currentActive)[0],
                        clone = Z.clone(anItem);
                    controller.storage.edit(anItem, Z.apply( clone,lastData));
                    clone.active = true;
                    controller.list.edit(clone.id, clone);
                    $.gritter.add({
                        //title: 'Изменения сохранены',
                        text: 'Данные были успешно сохранены'
                    });
                },
                data: {
                    sendAs: 'data',
                    sendTo: 'api/project/edit/',
                    xid: 'form',
                    items: [

                        {id: 'avatar',
                            cls:'aewgdn',
                            description: 'Аватарка б' +
                                'удет хорошего качества если закаченное изображение размером не менее 500x500 пикселей',
                            header: 'Картинка проекта',
                            header_small: 'Загрузите фото',
                            type: 'image',
                            text: 'Загрузить',
                            value: item.avatar
                        },
                        {type: 'header',header: 'О проекте', header_small: 'Общая информация'},
                        {type: 'form-group', bordered: true},
                        {id: 'name',  type: 'text', bordered: true, text: 'Имя в системе', value: item.name, placeholder: 'Новая компания'},
                        {id: 'fullName',  type: 'text', bordered: true, text: 'Полное наименование', value: item.fullName},
                        {id: 'company', type: 'select', bordered: true, text: 'Компания',
                            items: Z.storage.load('companies'),
                            value: item.company,
                            sort: 'name',
                            firstSelect: true
                        },
                        {id: 'description',  type: 'textarea', rows: '6', bordered: true, text: 'Описание', value: item.description, placeholder: 'Необязательное описание проекта в произвольной форме'},
                        {id: 'id',  type: 'hidden', text: '', value: item.id},
                        {type: 'submit', text: 'Сохранить'}
                    ]
                }
            });
            var getBalance = function(  ){


                Z.query( 'project', 'getStat', {id: item.id}, function( data ){
                    var div = document.createElement( 'div' ), pack;
                    div.innerHTML = DOM.tplRenderer( 'projStat' )( {
                        balance: data.data.balance.amount,
                        smsPrice: data.data.smsPrice,
                        sent: data.data.smsCount,
                        created: data.data.created,
                        package: pack =[
                            {count: 500, price: 1.5},
                            {count: 1000, price: 1.45},
                            {count: 2500, price: 1.4},
                            {count: 5000, price: 1.35},
                            {count: 10000, price: 1.3},
                            {count: 25000, price: 1.25},
                            {count: 50000, price: 1.2},
                            {count: 100000, price: 1.1},
                            {count: 150000, price: 1},
                            {count: 200000, price: 0.9},
                            {count: 500000, price: 0.8}
                        ],
                        cards: ['visa', 'mc']
                    } );
                    $( el.querySelector( '.js_content' ) ).prepend( div );
                    var $div = $( div );
                    $div.find( '.btn_add_money_js' ).click( function(){
                        Z.loadTpls( 'mc', function(){

                            $div.find( '.btn_add_money_real_js' ).click( function(){
                                var money = $( '.add_money_js input[type=radio]:checked' )[0].value;
                                money = pack.filter( function( el ){
                                    return el.count == money;
                                })[0];
                                if(money){
                                    money = (money.count * money.price) | 0;
                                    $div.find( '.pay_mob_frame_js' ).html( DOM.tplRenderer( 'mc' )( {
                                        merchant_url: 'http://billingrad.com',
                                        product: 'Зачисление ' + (
                                            money
                                        ) + ' рублей на счёт проекта',
                                        amount_format: Math.ceil( money * 1.03 ),
                                        more: '3'
                                    } ) );
                                }
                                $div.find( '.pay_mob_frame_js' ).animate( {top: 0} );
                            } );
                            var inSubmit = false;
                            var $form = $div.find( 'form' ).submit( function( e ){
                                if( inSubmit ){
                                    e.preventDefaul();
                                    return false;
                                }
                                inSubmit = true;
                                var $tel = $div.find( 'input[type=tel]' );
                                $form.animate( {'opacity': '0.5'} );
                                Z.query( 'bill', 'create', {
                                        pid: item.id,
                                        amount: money*100,
                                        type: 'mc',
                                        payer: $tel.val()
                                    }, function( res ){
                                        inSubmit = false;
                                        $form.animate( {'opacity': '1'} );
                                        $div.find( '.rows:first, .payler-action' )
                                            .css( {position: 'relative'} )
                                            .animate( {left: '-100%'}, function(){
                                                $div.find( '.rows:first' ).css( {
                                                    left: '100%'
                                                } ).html(
                                                    '<center><h1><img src="/img/load.gif" style="width:40px">&nbsp;Ожидайте СМС с инструкциями!</h1></center>'
                                                ).animate( {left: '0%'} );
                                            } );
                                        var check = function(){
                                            Z.query( 'bill', 'info', {bid: res.data, pid: item.id}, function( res ){
                                                var status = res.data.status;
                                                if( status === -1 ){
                                                    $div.find( '.rows:first h1' ).html( 'Платеж не прошел!' );
                                                }else if( status === 1 ){
                                                    $div.find( '.rows:first h1' ).html( 'Платеж прошел!' );
                                                }else{
                                                    return setTimeout( check, 2000 );
                                                }

                                                $div.find( 'form' ).unbind( 'submit' ).submit( function( e ){
                                                    e.preventDefault();
                                                    $div.find( '.pay_mob_frame_js' ).animate( {top: '-100%'}, function(){
                                                        $div.find( '.pay_mob_frame_js' ).html( '' );

                                                        $div.remove();
                                                        getBalance();

                                                    } );
                                                    return false;
                                                } );
                                                $div.find('#BgPostButton').val('Закрыть');
                                                $div.find( '.payler-action' ).animate( {left: '0%'} );

                                            }, function(){
                                                $div.find( '.rows:first h1' ).html( 'Непредвиденная ошибка!' )
                                            } )
                                        };
                                        setTimeout( check, 2000 );

                                    },
                                    function( res ){
                                        inSubmit = false;
                                        $form.animate( {'opacity': '1'} );
                                        if( res === 'invalidPayer' ){
                                            $( '.help-popup' ).addClass( 'show' );
                                            $tel.css( {background: '#fcc'} );
                                            setTimeout( function(){
                                                $tel.css( {background: '#fff'} );
                                            }, 250 );
                                        }

                                    } );

                                return false;
                            } );
                        } );
                    } );
                } );
            };
            getBalance();
        },
        log: function( el ){
            var item = this.storage.get('id', this.currentActive)[0];
            el.innerHTML = '';
            var inputs = $(el).append(
                    ' <h1>Статистика</h1>' +

                    '<div style="padding-bottom:5px"><span style="width: 2em;display: inline-block;">C: </span><input type="text"></div>' +
                    '<div><span style="width: 2em;display: inline-block;">По:</span><input type="text"></div>' +
                    '' +

                    '<div style="padding-top:30px;display:none" class="statz">' +
                        ' <!--h3>СМС</h3>' +
                        '<div>Отправлено смс: <span class="sended" style="font-size:1.3em"></span></div>' +
                        '<div>Стоимость отправленных смс: <span class="priced" style="font-size:1.3em"></span></div-->' +
                        '<h3>Баланс</h3>' +
                        '<div class="payments"></div>'+
                    '</div>' +
                    '' ).find('input').datepicker({
                        inline: true
                    } ).change( function(){
                            setTimeout( changeFn, 200 );
                    });
            var stat = $( el ).find('.statz');
            var lastData = null;
            var changeFn = function(  ){
                var data = [
                    +$(inputs[0]).datepicker('getDate'),
                    +$(inputs[1]).datepicker('getDate')
                ];
                if(lastData !== data.join(',') ){

                    lastData = data.join(',');
                    stat.hide();

                    stat.find('.payments' ).html('<img src="/img/load.gif" width="50px">');
                    Z.query('statistic','project', {pid: item.id, from: data[0],to:data[1]}, function( res ){
                        var data = res.data;
                        stat.find('.payments' ).html(
                            data.length?
                                data.sort(function(a,b){
                                    return a.date<b.data?-1: a.date>b.date?1:0;
                                }).map(function(el){
                                    var add = el.to===item.id;
                                    return '<div class="status alert-'+(add?'success':'danger')+'">'+
                                        (dateFormatter(+new Date(el.date))) +
                                        '&nbsp;&mdash; '+(add?'поступление':'списание')+' '+
                                        (el.amount/100) +' рублей</div>';

                                } ).join('')
                            :
                                '<div class="status alert-info">Операций с балансом не происходило</div>'
                        );
                        stat.show();
                    });

                }
            };
            var d = new Date();
            d = d.setHours(0,0,0,0);
            var last = new Date(d);
            last.setMonth(last.getMonth() - 3);
            $( inputs[0] ).datepicker('setDate', last);
            $( inputs[1] ).datepicker('setDate', d);
            changeFn();
        },

        delivery: function( el ){
            var mnu = this;
            var item = this.storage.get('id', this.currentActive)[0],
                projectItem = item,
                route = this.route,
                pid = this.currentActive;
            if( !item.delivery || !item.delivery.approved ){

                el.innerHTML = '<DIV style="font-size:34px;background: #fff;padding: 70px 0 100px"><center>' +
                    '<img width="100%" src="http://billingrad.com/bg-site/img/slides/logo-pic.jpg"><br><br>' +
                    'Billingrad &mdash; лучшее решение для организации sms рассылок.<br>' +
                (item.delivery && item.delivery.requested?'Заявка на одобрение смс рассылок находится на одобрении, но вы всё равно можете <a href="/#/about/">связаться с нами</a>!'
                    :'Для одобрения проекта <a href="/#/about/">свяжитесь с нами,</a> ' +
                'или <input type="button" class="btn btn-primary" value="отправьте заявку">.') +
                '</center></DIV>';
                $(el ).find('input[type=button]' ).click( function(  ){
                    Z.query('project','requestAbility',{pid: pid, type:'delivery'}, function( res ){
                        item.delivery = {requested: true};
                        Z.controller.projects.tabRenderer.delivery.call(mnu,el);
                    });
                });
                return false;
            }


            var senders = (item.sender || [])
                .filter(function(el){return el.approved===true;} )
                .map(function(el){return {id: el.sender, name: el.sender};});
            if( senders.length === 0 )
                senders = [{id: 'billingrad',name: 'billingrad'}];
            var changes = [];
            el.innerHTML = DOM.tplRenderer('deliveryLayout')({
                name: route[2],
                top: 1.8,
                items: senders
            });
            var loading = $('.js_loading' );
            var itemList = $('.js_itemList' );
            var topDeliveries = $('.js_top_deliveries' );
            var flexContainer = $('.flex-container' );
            var credentials = $('.js_credentials');
            var newMessage = $('.js_new_message');
            var setTopHeight = function( num ){
                /*topDeliveries.css({height: 40*num+'px'});
                flexContainer.css({top: 40*num+'px'});*/
            };
            var token;


            Z.query('delivery', 'list', {pid: pid}, function( data ){
                var currentToken = token = Z.UUID.getRandom();
                IO.un('delivery');

                var arr = data.data || [];

                if( arr.length ){
                    $('.js_delivery_manual' ).slideUp(function(){
                        $('.js_delivery_manual' ).remove();
                    });
                    //setTopHeight( arr.length > 5 ? 5 : arr.length );
                    itemList.html(arr.map(DOM.tplRenderer('deliveryItem') ).join(''));
                    credentials.show();
                    newMessage.show();
                }else{
                    itemList.html(DOM.tplRenderer('deliveryManual'));
                    credentials.hide();
                    newMessage.hide();
                }


                /*for( var i = 0; i < 3; i++)
                arr.push({name: i})*/

                var currentDelivery = isNaN(parseInt(route[2],10)) ? arr[arr.length - 1]
                    :
                    arr.filter(function(el){return el.did==route[2]; })[0];
                if( currentDelivery ) {
                    Z.query('project', 'getBalance', {id: currentDelivery.pid}, function (data) {
                        if (data.error)
                            return;
                        this.amount = data.data.amount;
                    }.bind(currentDelivery));
                    itemList.val(currentDelivery.did);
                };
                /*if(!currentDelivery)
                    return;*/
                (function(  ){
                    var el = $('.js_itemList' ),
                        holder = $('.js_top_deliveries' ),
                        h = holder.height(),
                        items = el.find('.item' ),
                        l = items.length,
                        /*fn = function(  ){
                            var center = h/2/40,
                                top = holder[0].scrollTop/40,
                                item,
                                style,
                                m = Math;

                            for(var i = m.max((top-7)|0,0), _i = m.min((top+7)|0,l); i < _i; i++){
                                var distance = 1-m.abs(top-i-0.5)/17,
                                    strange = (m.pow(0.5+distance,2)-0.7)*15;
                                style = items[i].style;
                                style.fontSize = strange + 10 +'px';
                                style.paddingLeft = strange+'px';
                                var c = Math.min(15,((m.pow((strange/24),2)*18)|0)).toString(16);
                                style.color = '#'+c+c+c;
                                var b = 150+c*5;
                                style.background = 'rgba(49,45,50,'+((strange/40))+')';

                            }
                            el[0].style.paddingTop = (h/(l)*top)+'px';

                        },*/
                        addNew = function( text ){
                            var t1 = holder[0].scrollTop,
                                obj = {name: text, pid: pid};
                            if( arr.length === 0 ){
                                itemList.html('');
                                credentials.show();
                                newMessage.show();

                            }
                            arr.push(obj);
                            l++;
                            //var div = $('<div class="item">'+text+'</div>');
                            //el.append(div);
                            //div.hide().slideDown();
                            //el.css('height',h+l*40);


                            //fn();
                            //var t2 = holder[0].scrollTop+ holder[0].scrollHeight;
                            //holder[0].scrollTop = t1;


                            //$(holder).animate({scrollTop: t2}, 1000);

                            $('.js_new_item').slideUp();
                            $('.js_addNew').fadeIn();
                            Z.query('delivery', 'create', {data: obj}, function( data ){
                                obj.did = data.data;
                                el.append(DOM.tplRenderer('deliveryItem')(obj));
                                items = el.find('.item');
                                itemList.val(obj.did).change();


                            });

                        },
                        msgs = [],
                        getStats = function( e ){
                            var target = e.target,
                                msg = $(e.target).parents('.js_message:first' ),
                                isStat = msg.attr('data-stat'),
                                stat = $(msg ).find('.js_message_stat' ),
                                msgId = msg.attr('data-id');

                            if( isStat )
                                return;

                            if( target.className.indexOf('js_m_p')===-1)
                                return;
                            var s = target.className.match('js_m_p_(.*)$')[1];

                            msg.attr('data-stat','true');

                            Z.query('delivery','messageStat', {mid: msgId, stat: s}, function( data ){
                                if(!data.error){
                                    var list = data.data;
                                    stat.html( list.map( function( el ){
                                        return '<b>' + (el.phone || el.cid) + '</b>: ' + (Z.smsStatusMap[el.status] || 'Другой');
                                    } ).join( '<BR>' ) );
                                    stat.slideDown();
                                }
                            });


                            //$('')
                        },
                        msgAdd = function(el, instant){
                            if(el.text === null || el.text === void 0)
                                el.text = '';

                            el.text = el.text.replace(/\n/g,'<br>');
                            msgs.push(el);
                            var newDiv = document.createElement('div');
                            newDiv.innerHTML = DOM.tplRenderer('deliveryMessage')(el);
                            newDiv = newDiv.childNodes[0];
                            el.el = newDiv;

                            $('.js_messages' ).append(newDiv);
                            $(newDiv).on('click', '.js_m_p', getStats);
                            var scrollFn = function(){$('.js_messages' ).stop().animate({scrollTop:$('.js_messages' )[0].scrollHeight})};
                            if( instant !== true ){
                                var t = setInterval(scrollFn,10);
                                $(newDiv).hide().slideDown(function(){
                                    clearInterval(t);
                                });
                            }else{
                                scrollFn();
                            }

                        };
                    if( !holder.length )return;
                    IO.on('delivery',function(data){
                        var mid = data.mid;
                        msgs.filter( function( el ){
                            return el.mid+'' === mid+'';
                        } ).forEach( function( el ){
                            if(data.delivery){
                                el.progressCount = (el.progressCount||0)-data.delivery;
                                el.deliveryCount = (el.deliveryCount||0)+data.delivery;
                            }
                            if(data.fail){
                                el.progressCount = (el.progressCount||0)-data.fail;
                                el.failedCount = (el.failedCount||0)+data.fail;
                            }
                            if(data.progress)
                                el.progressCount = (el.progressCount||0)+data.progress;

                            var newDiv = document.createElement('div');
                            newDiv.innerHTML = DOM.tplRenderer('deliveryMessage')(el);
                            newDiv = newDiv.childNodes[0];
                            el.el.parentNode.replaceChild(newDiv, el.el);
                            el.el = newDiv;

                        });
                    });
                    var search = $('.js_delivery_search');
                    if( currentDelivery ) {
                        var loadMessages = function () {
                            Z.query('delivery', 'getMessages', {did: currentDelivery.did, filter: search.val()}, function (data) {
                                $('.js_messages .js_message').remove();
                                while (msgs.pop());

                                data.data.reverse().forEach(function (el) {
                                    el.progressCount = el.progressCount - el.deliveryCount - el.failedCount;
                                    msgAdd(el, true)
                                });
                                loading.hide();
                            });
                        };
                        loadMessages();
                        var delay, last;
                        search.on('change keyup', function () {
                            if( last === this.value ) return;
                            last = this.value;
                            clearTimeout(delay);
                            delay = setTimeout(function () {
                                loadMessages();
                            }, 700);
                        });
                    }else
                        loading.hide();
                    //el.css('height',h+l*40);
                    //DOM.addListener(holder[0],'scroll', fn);
                    itemList.on('change', function(){
                        document.location.hash = '#/projects/'+route.slice(0,2).join('/')+'/'+this.value +'/';
                    });
                    $('.js_addNew' ).click( function(  ){
                        $('.js_addNew').fadeOut();
                        $('.js_new_item').slideDown();


                        var input = $('.js_new_item input[type=text]' );
                        input.focus();
                        var tryAdd = function(  ){
                            var val = input.val();
                            if( val.trim().length > 0 ){
                                input.val('');
                                addNew(val)
                            }
                        };
                        $('.js_add_btn' ).click( function(  ){
                            tryAdd();
                        });
                        $('.js_cancel_add_btn' ).click( function(  ){
                            input.val('');
                            $('.js_new_item').slideUp();
                            $('.js_addNew').fadeIn();
                        });
                        input.keydown( function( e ){

                            if(e.which === 13 || e.which === 10){
                                tryAdd();
                            }
                        });

                    });
                    //fn();
                    if( currentDelivery ){
                        window.initialize( $('.js_credentials')[0] );
                        itemList.val(currentDelivery.did).change();

                        var contactCount = 0;
                        $('.js_to')
                            .val(currentDelivery.sendTo)
                            .change( function(  ){
                                if(currentDelivery.sendTo !== this.value){
                                    changes.push({ did: currentDelivery.did, sendTo: this.value });
                                    startObserveChanges();
                                }
                                contactCount = this.value.split(';' ).map( function( el ){
                                    var data;
                                    data = Z.storage.contactLists.get('name',el)
                                    if(data.length)
                                        return data[0].length;
                                    else
                                        return 1;
                                } ).reduce( function( a, b ){
                                        return a+b;
                                },0);
                                $('.msg_text' ).change();
                            } ).trigger('change');
                        $('.js_from' )
                            .val(currentDelivery.sender)
                            .change( function(  ){
                                if(currentDelivery.sender !== this.value){
                                    if(this.value === null){
                                        $(this ).val($('.js_from option:first').val());
                                        return;
                                    }
                                    changes.push({ did: currentDelivery.did, sender: this.value });
                                    startObserveChanges();
                                }
                            } );
                        var symbolEl = $('.symbol_counter' );
                        var enoughMoney = false;
                        var checkMoney = function( length ){

                            var needMoney = length*contactCount*projectItem.smsPrice;

                            if( (currentDelivery.amount*100+(projectItem.credit|0)) < needMoney && !projectItem.postPay){
                                console.log({
                                    needMoney: needMoney,
                                    length:length,
                                    contactCount:contactCount,
                                    price:projectItem.smsPrice,
                                    currentDelivery: currentDelivery,
                                    postPay: projectItem.postPay
                                });
                                if(enoughMoney){
                                    enoughMoney = false;
                                    $('.js_send_balance_error' ).fadeIn();
                                }
                                return false;
                            }else{
                                if( !enoughMoney ){
                                    enoughMoney = true;
                                    $('.js_send_balance_error' ).hide();
                                }
                            }

                            return true;
                        };
                        var msgText = $('.msg_text' ).on('change keyup mouseup', function(){
                                var lenghts = smsLength( this.value ).reverse().slice(1);
                                checkMoney(lenghts[1]);
                                symbolEl.html(lenghts.join(' / ') + ' x '+ contactCount);
                            } ).change(),
                            step = 0,
                            sendMsg = function(  ){

                                if(!checkMoney(smsLength( msgText.val() )[0]))return;
                                if( !step ){
                                    step = 1;
                                    setTimeout( function(  ){
                                        $('.js_send_approve_msg_btn' ).fadeIn();
                                        $('.js_send_msg_btn' ).fadeOut();
                                    }, 100);
                                    setTimeout( function(  ){
                                        step = 2;
                                    }, 100);
                                }
                                if( step === 2 ){
                                    step = 3;
                                    var text = msgText.val();
                                    Z.query('delivery', 'createMessage', {
                                        data: {
                                            id: currentDelivery.did,
                                            text: text
                                        },
                                        planned: true
                                    }, function( data ){
                                        $('.js_send_approve_msg_btn' ).fadeOut();
                                        $('.js_send_msg_btn' ).fadeIn();
                                        step = 0;
                                        var mid;
                                        msgAdd( { text: text, mid: mid = data.data, createDate: +new Date() } );

                                        var d = +new Date()-1000;

                                        var f = function(  ){
                                            Z.query('delivery','messageInfo',{mid: mid}, function(res){
                                                var data = res.data;
                                                var m = {};
                                                msgs.filter( function( el ){
                                                    return el.mid+'' === mid+'';
                                                } ).forEach( function( el ){
                                                    m = el;
                                                    el.progressCount = data.progressCount - data.deliveryCount - data.failedCount;
                                                    el.deliveryCount = data.deliveryCount;
                                                    el.failedCount = data.failedCount;

                                                    var newDiv = document.createElement('div');
                                                    newDiv.innerHTML = DOM.tplRenderer('deliveryMessage')(el);
                                                    newDiv = newDiv.childNodes[0];
                                                    el.el.parentNode.replaceChild(newDiv, el.el);
                                                    el.el = newDiv;

                                                });
                                                if( m.progressCount > 0 ){
                                                    var delta = +new Date() - d;
                                                    setTimeout( f, delta > 1000*60*5 ? 1000*60*5 : delta );
                                                    d += 1000;
                                                }

                                            });

                                        };
                                        setTimeout(f,+new Date() - d);


                                    });

                                    msgText.val('' ).change();
                                }
                            },
                            sendBtn = $('.js_send_msg_btn' ).click( sendMsg );
                            $('.js_send_approve_msg_btn' ).click( sendMsg );

                        msgText.keyup(function(e){
                            if( (e.which === 13 || e.which === 10) && e.ctrlKey ){
                                sendMsg();
                                return false;
                            }else{
                                if( step > 0 && step < 3 && (e.ctrlKey !== true && e.which !== 10 && e.which !== 13) ){
                                    step = 0;
                                    $('.js_send_approve_msg_btn' ).fadeOut();
                                    $('.js_send_msg_btn' ).fadeIn();
                                }
                            }
                        });
                    }
                })();
            }, function () {
                loading.hide();
                el.innerHTML = '<h1>Нет прав, обратитесь к администратору</h1>';
            });
            var observing = false;
            var startObserveChanges = function( ){

                !observing && setTimeout( function(  ){
                    observing = false;
                    var objs = {}, el;
                    while( el = changes.shift() ){
                        objs[el.did] = objs[el.did] || {};
                        Z.apply( objs[el.did], el );
                    }
                    for( var i in objs ){
                        if( objs.hasOwnProperty(i) ){

                            objs[i].id = objs[i].did;
                            delete objs[i].did;
                            Z.query('delivery', 'edit', {data:objs[i]});
                        }
                    }
                }, 200);
                observing = true;
            }
        },
        send: function( el ){
            var symbolEl;
            var item = this.storage.get('id', this.currentActive)[0];
            el.innerHTML = DOM.tplRenderer('standardLayout')({name: '<input class="form-control big js_title_edit" value=""/>'});
            this.buildTitleInput( el.querySelector('.js_title_edit'), item );
            var senders = (item.sender || [])
                .filter(function(el){return el.approved===true;} )
                .map(function(el){return {id: el.sender, name: el.sender};});
            if( senders.length === 0 )
                senders = [{id: 'billingrad',name: 'billingrad'}];

            var already = {};
            var lastValidate;
            var f = widgets.form({
                renderTo: el.querySelector('.js_content'),
                validate: function( data ){
                    if( already[data.text+data.to] ){
                        if( +new Date() - lastValidate < 300 ){
                            lastValidate = +new Date();
                            return false;
                        }
                        lastValidate = +new Date();
                        $.gritter.add({
                            text: 'Такое сообщение уже отправлено'
                        });
                        return false;
                    }
                    already[data.text+data.to] = true;
                    lastValidate = +new Date();
                    return data.text.length > 0 && data.to.length > 0;
                },
                error: function( data ){

                    $.gritter.add({
                        text: data && data.text === 'notEnoughMoney'?'Недостаточно средств':'Ошибка отправки сообщения'
                    });
                    //alert( data.text );
                },
                success: function( data ){
                    var count;
                    if( data && data.data && (count=data.data.count) ){
                        $.gritter.add({
                            text: count+' '+ Z.pluralForm(count+',сообщение,сообщения,сообщений')+' было добавлено в очередь на отправку'
                        });
                    }else{
                        $.gritter.add({
                            text: 'Ничего не отправлено'
                        });
                    }
                },
                data: {
                    change: function( id, val ){
                        id === 'text' && (
                            symbolEl.innerHTML = smsLength( val ).reverse().join('/')
                        );
                    },
                    xid: 'form',

                    sendTo: 'api/sms/send/',

                    items: [
                        {id: 'id', type: 'hidden',  value: item.id},
                        {
                            id: 'from',
                            type: 'select',
                            bordered: true,
                            text: 'Отправитель',
                            items: senders,
                            value: ( item.sender && item.sender[0] && item.sender[0].sender ) || 'billingrad'
                        },
                        {id: 'to', type: 'phones', bordered: true, text: 'Кому', placeholder: 'Номера телефонов, названия списков контактов'},
                        {id: 'text',  type: 'textarea', rows: 6, text: 'Текст сообщения <span class="label label-default js_symbol_count">160/0</span>', placeholder:'Текст сообщения'},
                        {id: 'btnSubmit', type: 'submit', text: 'Отправить'}
                    ]}
            });
            symbolEl = el.querySelector('.js_symbol_count');
        }
    },
    router: function( route ){
        this.route = route;
        this.listLoaded && this.navigate();
    },
    titleFocus: function(  ){
        this.currentTitleInput.focus();
        //TODO select all
    },
    buildTitleInput: function( input, item ){
        this.currentTitleInput = input;
        var controller = this;
        input.value = item.name;
        var oked = true;
        var changed = function(  ){
            var val = input.value.trim();
            if( item.name !== val && val !== '' ){
                item.name = val;
                item.active = true;
                controller.list.edit(item.id, item);
                oked = false;
            }
        };
        //setTimeout(input.focus.bind(input),10);
        DOM.addListener(input, 'mouseup', changed);
        DOM.addListener(input, 'change', changed);
        DOM.addListener(input, 'keyup', changed);

        var ok = function(  ){
            if( !oked ){
                oked = true;
                setTimeout( function(  ){
                    controller.fire('titleEdit', item.name);
                }, 10);
            }else{
                input.value = item.name;
            }
        };
        DOM.addListener(input,'focus', function(  ){

        });
        DOM.addListener(input,'blur', ok);
        DOM.addListener(input,'keydown', function( e ){
            if( e.keyCode === 13 || e.keyCode === 27 ){
                this.blur();
                ok();
            }
        });
    },
    navigate: function(  ){
            var listName, item;
            if( this.currentActive ){
                item = Z.clone(this.storage.get('id', this.currentActive )[0]);
                if(item){
                    item.active = false;
                    this.list.edit(item.id, item);

                }
            }

            listName = (this.route[0] || '').trim().toLowerCase() ||
                (this.storage.data && this.storage.data[0]?this.storage.data[0].id : 'new');
            if( listName === 'new' ){
                this.currentActive = void 0;
                this.fire('tabChange', ['new']);
            }else{
                item = this.storage.get('id', listName);
                if(!item.length)
                    return;
                item = Z.clone(item[0]);
                item.active = true;
                this.list.edit(item.id, item);
                this.list.renderTo.scrollTop = $(this.list.renderTo).find('.expanded').position().top;
                if( this.currentActive !== item.id ){
                    this.currentActive = item.id;
                }
                var r = this.route.slice(1);
                this.fire( 'tabChange', r.length ? r : ['about']);
            }
    },
    destroy: function(  ){
        this.lastTab = void 0;
    }
};

Z.observable(Z.controller.projects);