var PermissionPlugin = function (cfg) {
    var text = cfg.text,
        id = cfg.id;
    var act = {};
    act[id+'_takePermission'] = function () {
        alert('todo')
    };
    act[id+'_givePermission'] = function( obj, cb, el ) {
        Z.doAfter(function (callback) {
            Z.query('collaborate', 'get', {creator: obj.id}, function (data) {
                if (data.data) {
                    Z.query('collaborate', 'approve', {id: data.data._id}, function (data) {
                        callback();
                    });
                } else {
                    Z.query('project', 'requestAbility', {pid: obj.id, type: id}, function (res) {
                        Z.query('collaborate', 'get', {creator: obj.id}, function (data) {
                            Z.query('collaborate', 'approve', {id: data.data._id}, function (data) {
                                callback();
                            });
                        });
                    });
                }
            });
        }, function () {
            el.className = 'green';
            el.setAttribute('data-act', '');
            el.innerHTML = '!Выдано!';
        });
    };
    act[id+'_denyPermission'] = function( obj, cb, el ) {
        Z.doAfter(function (callback) {
            Z.query('collaborate', 'get', {creator: obj.id}, function (data) {
                if (data.data) {
                    Z.query('collaborate', 'deny', {id: data.data._id}, function (data) {
                        callback();
                    });
                } else {
                    Z.query('project', 'requestAbility', {pid: obj.id, type: id}, function (res) {
                        Z.query('collaborate', 'get', {creator: obj.id}, function (data) {
                            Z.query('collaborate', 'deny', {id: data.data._id}, function (data) {
                                callback();
                            });
                        });
                    });
                }
            });
        }, function () {
            el.className = 'green';
            el.setAttribute('data-act', '');
            el.innerHTML = '!Отказано!';
        });


    };
    return {
        name: cfg.name,
        empty: function(){ return {}; },
        build: function( obj ){
            if( obj.approved )
                this.innerHTML = text.have +' '+
                    '<span class="action" data-act="'+id+'_takePermission">-Отозвать-</span>'
            else if( obj.approved === false )
                this.innerHTML = text.deny +' ' +
                    '<span class="action" data-act="'+id+'_givePermission">-Разрешить-</span>'
            else
                if( obj.requested )
                    this.innerHTML = text.requested +' ' +
                    '<span class="action" data-act="'+id+'_givePermission">-Выдать-</span> '+
                    '<span class="action" data-act="'+id+'_denyPermission">-Отказать-</span>';
                else
                    this.innerHTML = text.no +' '+
                    '<span class="action" data-act="'+id+'_givePermission">-Выдать-</span>';

        },
        act: act
    };
};

var plugin = {
    project: {
        'mfo': new PermissionPlugin({
            id: 'mfo',
            name: 'МФО',
            text: {
                have: 'Имеется разрешение',
                deny: 'В мфо отказано',
                requested: 'Запрошено разрешение',
                no: 'Разрешение не запрашивалось'
            }
        }),
        'mc': new PermissionPlugin({
            id: 'mc',
            name: 'МК',
            text: {
                have: 'Имеется разрешение',
                deny: 'В мобильной коммерции отказано',
                requested: 'Запрошено разрешение',
                no: 'Разрешение не запрашивалось'
            }
        }),
        'delivery': new PermissionPlugin({
            id: 'delivery',
            name: 'Рассылки',
            text: {
                have: 'Имеется разрешение',
                deny: 'В рассылке отказано',
                requested: 'Запрошено разрешение',
                no: 'Разрешение не запрашивалось'
            }
        }),
        'sender': {
            name: 'Отправители',
            empty: function(){ return []; },
            build: function( obj, full ){
                this.innerHTML = obj.map( function( el ){
                    return '&nbsp;'+(el.approved?'+':el.deny?'-':'?')+ el.sender+ ' '+
                        (el.approved? '<span class="action" data-act="sender_denyPermission" data-sender="'+el.sender+'">-отозвать-</span>':(
                        el.deny? '<span class="action" data-act="sender_givePermission" data-sender="'+el.sender+'">-пущай-</span>':
                            '<span class="action" data-act="sender_givePermission" data-sender="'+el.sender+'">-дать-</span> <span class="action" data-act="sender_denyPermission" data-sender="'+el.sender+'">-нельзя-</span>')
                        )
                        ;
                } ).join('<br>')+
                    '<br>&nbsp; <span class="action" data-act="sender_addNew">++Добавить отправителя++</span>';
            },
            act: {
                sender_givePermission: function( obj, cb, el ){
                    var sender = el.getAttribute('data-sender' ),
                        item = ((obj.sender||[]).filter( function( item ){
                            return item.sender === sender;
                        })[0]||{});
                    item.approved = true;
                    item.deny = false;
                    Z.query('project', 'box', {pid: obj.id, type: 'sender', overwrite: true, data:obj.sender});
                    drawer.project( $(el).parents('.pane')[0], obj )
                },
                sender_denyPermission: function( obj, cb, el ){
                    var sender = el.getAttribute('data-sender' ),
                        item = ((obj.sender||[]).filter( function( item ){
                            return item.sender === sender;
                        })[0]||{});
                    item.approved = false;
                    item.deny = true;
                    Z.query('project', 'box', {pid: obj.id, type: 'sender', overwrite: true, data:obj.sender});
                    drawer.project( $(el).parents('.pane')[0], obj )
                },
                sender_addNew: function( obj, cb, el ){
                    dialog(
                        'Добавить отправителя',
                        'Отправитель<br>' +
                        '<input type="text" placeholder="sender">',
                        [
                            {text: 'Добавить', 'default': true, fn: function(){
                                var input = this.body.find('input');
                                var val = input.val().trim();

                                if( val.match( /[^ a-zA-Z0-9\.\-@\+\*\\]/ ) !== null ){
                                    alert('Недопустимый символ');
                                    input.css({background:'#a00'});return false;
                                }
                                if( val.length === 11 && (
                                    val.match( /[^0-9]/ ) !== null ||
                                    val.match( /[^0-9]/ ) !== null
                                    ) ){
                                    alert('Много буков');
                                    input.css({background:'#a00'});return false;
                                }
                                if( val.length === 12 ){
                                    alert('Много буков');
                                    input.css({background:'#a00'});return false;
                                }
                                if(val.length > 11){
                                    input.css({background:'#a00'});
                                    return false;
                                }
                                obj.sender.push({sender: val, approved: true});
                                drawer.project( $(el).parents('.pane')[0], obj );
                                Z.query('project', 'box', {pid: obj.id, type: 'sender', overwrite: true, data:obj.sender});
                            }},
                            {text: 'Отмена'}
                        ]
                    ).body.find('input').focus();
                }
            }
        },
        'request': {
            name: 'Уведомления',
            empty: function(){ return {}; },
            build: function( obj ){
                var data = [];
                Z.each(obj, function( name, obj ){
                    data.push('<i>'+ name +'</i>' );
                    data.push(obj.method +'&nbsp;'+ obj.url );
                    data.push(obj.body);
                    data.push('')
                });
                this.innerHTML = data.join('<br>');
            }
        },
        'deliveries': {
            name: 'Рассылки',
            empty: function(){ return {}; },
            build: function( obj, item ){
                /*var data = [];
                Z.each(obj, function( name, obj ){
                    data.push('<i>'+ name +'</i>' );
                    data.push(obj.method +'&nbsp;'+ obj.url );
                    data.push(obj.body);
                    data.push('')
                });*/

                Z.query('delivery', 'list', {
                    pid: item.id
                }, function (data) {
                    this.innerHTML = data.data.map(function(el){
                        return '<i>'+ el.name +'</i>';
                    }).join('<br>');
                }.bind(this));

            }
        }
    },
    user: {},
    init: function(  ){
        Z.each(plugin, function( type, obj ){
            typeof obj === 'object' && Z.each( obj, function( plugin, obj ){
                obj.act && Z.apply(doAct, obj.act);
            });

        });
    }
};
var URIs = {};
    var urlBuilder = function( cfg ){
        cfg && Z.apply(URIs, cfg);
        var hash = [];
        Z.each(URIs, function( k, v ){
            hash.push(k+'='+encodeURIComponent(v));
        });
        document.location.hash = hash.join('&');
    };
    urlDecoder = function(  ){
        var o = {};
        document.location.hash.replace(/^#/,'').split('&').forEach(function( token ){
            var tokens = token.split('=');
            o[tokens[0]] = decodeURIComponent(tokens[1]);
        });
        URIs = o;

    };
    var currency = function( val ){
        val = val / 100 || 0;
        val = val.toFixed(2);

        return val;
    };
    var itemsRenderer = {
        'user': function( el ){
            return '<div class="item">'+tab(el)+'<span class="group group_user">U</span>'+
                        (el.login||el.email||el.phone)+
                    '</div>';
        },
        'zone': function (el) {
            return '<div class="item">'+tab(el)+'<span class="group group_zone">Z</span>'+
                        (el.name)+
                    '</div>';
        },
        'sender': function (el) {
            return '<div class="item">'+tab(el)+'<span class="group group_project">Z</span>'+
                        (el._name)+
                    '</div>';
        },
        'zoneAdd': function (el) {
            return '<div class="item"><i>+ Добавить зону</i></div>'
        },
        'project': function( el ){
            return '<div class="item">'+tab(el)+'<span class="group group_project">P</span>'+
                        (el.name)+
                    '</div>';
        },
        'company': function( el ){
            return '<div class="item">'+tab(el)+'<span class="group group_company">C</span>'+
                        (el.name)+
                    '</div>';
        },
        'group': function( el ){
            return '<div class="item"><i>'+
                        (el.name)+
                    '</i></div>';
        },
        'request': function( el ){
            return '<div class="item"><i>'+
                        dateTimeFormatter(+new Date(el.create_date))+': '+el.module+'.'+el.fn+
                    '</i></div>';
        },
        statistic: function( el ){
            return '<div class="item">'+tab(el)+'<span class="group group_wallet">W</span>'+
                    (pHash[el.owner]||{name: el.owner}).name+
                    '&nbsp;<span class="green">+'+currency(el.to)+'</span>'+
                    '&nbsp;<span class="red">&minus;'+currency(el.from)+'</span>'+
                '</i></div>';
        }
    },
    tab = function( el ){
        return (new Array((el.tab || 0)+1)).join('&nbsp;');
    };
    var cheat = false;
    var dateFormatter = function( date ){
            var dat = new Date( parseInt(date) );
            return dat.getDate() + ' '+ ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"][dat.getMonth()] +' ' + dat.getFullYear()
        },
        monthFormatter = function( date ){
            var dat = new Date( parseInt(date) );
            return ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"][dat.getMonth()] +' ' + dat.getFullYear()
        },
        dateTimeFormatter = function( date ){
            var dat = new Date( parseInt(date) );
            return dateFormatter( date ) + ' ' + dat.getHours() + ':' + ('0'+dat.getMinutes()).substr(-2);
        },
        dateTimeSecondsFormatter = function( date ){
            var dat = new Date( parseInt(date) );
            return dateTimeFormatter( date ) + ':' + ('0'+dat.getSeconds()).substr(-2);
        };
    var wrap = function( val, i ){
        val += '';
        if(val.length === 32 && val.match(/[^0-9a-z]/) === null ){
            val = '<span class="green">'+val+'</span>';
        }else if(val.length === 13 && val.match(/[^0-9]/) === null ){
            val = '<span class="green">'+dateTimeFormatter(val-0)+'</span>';
        }
        return '<span class="js_value js_value_'+i+'" data-type="'+i+'">'+val+'</span>';
    };
    var dialog = function( title, text, button, hide ){
        var $dialog = $('.dialog:first').clone(),
            $title = $dialog.find('.dialog_title').html(title),
            $body = $dialog.find('.dialog_body').html(text),
            $btns = $dialog.find('.dialog_btns').html('' ),
            clickFn = function(item){
                var result = item.fn && item.fn.call(d);
                if( result !== false )
                    d.hide();
            };
        (button||[{text:'Закрыть'}]).forEach(function(item){
            var $btn = $('<div class="dialog_btn"></div>').html(item.text);
            $btns.append($btn);
            $btn.click( function(  ){
                clickFn(item);
            })
        });
        DOM.addListener($body[0],'keyup', function( e ){
            if( e.keyCode === 13 ){
                var items = (button||[]).filter( function( item ){
                    return item['default'];
                } );
                if( items.length ){
                    e.stopPropagation();
                    e.preventDefault();
                    clickFn(items[0]);
                }
            }
        });
        var d = {
            el: $dialog,
            body: $body,
            show: function(){
                $(document.body).append($dialog);
                $dialog.fadeIn();
            },
            hide: function(){
                $dialog.fadeOut(function(){
                    $dialog.remove();
                    hide && hide();
                })
            }
        };
        d.show();
        return d;
    };
    var doAct = {
        projectRemove: function (obj, cb) {
            var nums = [(Math.random()*100)|0,(Math.random()*100)|0,(Math.random()*100)|0,(Math.random()*100)|0].map(function(el){return (el+1)*(Math.random()>0.5?1:-1);}),
                ops = [{
                    name: ['прибавить','плюс'],
                    op: '+'
                },{
                    name: ['отнять','вычесть'],
                    op: '-'
                },{
                    name: ['умножить','домножить','домножить на'],
                    op: '*'
                },{
                    name: ['поделить','поделить на','сделать обратную умножению операцию на'],
                    op: '/'
                }];

                var expr = [nums[0]],
                    calc = '('+nums[0]+')',
                    wrongs = [calc,calc,calc,calc];
                for(var i = 1; i < 4; i++){
                    var o = (Math.random()*ops.length)|0;

                    expr.push(ops[o].name[(Math.random()*ops[o].name.length)|0])
                    wrongs = wrongs.map(function (w) {
                        return w+ops[(Math.random()*ops.length)|0].op+'('+nums[i]+')'
                    });
                    calc+=ops[o].op+'('+nums[i]+')';
                    expr.push(nums[i])
                }
                var ans = eval(calc).toFixed(1);
                wrongs = wrongs.map(function (calc) {
                    return eval(calc).toFixed(1);
                });
            wrongs.splice((Math.random()*(wrongs.length+1))|0,0,ans);

            var quest = [
                {
                    text: 'Вы уверены что хотите удалить проект `'+obj.name+'`?',
                    next: 'Да',
                    btn: ['Да']
                },
                {
                    text: 'Это очень безвозвратно, точно уверены?',
                    next: 'Да',
                    btn: ['Да']
                },
                {
                    text: 'Тогда мы поиграем в игру.',
                    next: 'Ну ок',
                    btn: ['Ну ок']
                },
                {
                    text: 'Чему будет равно выражение:<br>'+
                        expr.join(' ')+'<br>'+
                        'Операции имеют математический приоритет. Округли до десятых по правилам математики. Разделитель дробной части - точка. Даже если число целое - пиши его с дробной частью.',
                    next: ans,
                    btn: wrongs
                },
                {
                    text: 'Ты прошел испытание, но хочешь ли ты всё ещё удалить проект `'+obj.name+'`?',
                    next: 'Да',
                    btn: ['Да']
                }
            ];
            var doStep = function (step) {
                var s = quest[step];

                s.btn = s.btn.map(function (el) {
                    var btn = {text: el};
                    if(el=== s.next)
                        btn.fn = function () {
                            if(step+1===quest.length){
                                Z.query('project','remove', {
                                    id: obj.id
                                }, function () {
                                    urlBuilder({left: 'project',left_id: ''});
                                    var id = obj.id;
                                    delete pHash[id];
                                    project = project.filter(function(el){return el.id!==id});
                                    doSearch(true)
                                    doSearch(true);
                                });
                            }else
                                doStep(step+1);
                        };
                    return btn;
                });
                s.btn.splice((Math.random()*(s.btn.length+1))|0,0,{text:'Сдаться','default':true});
                dialog('Вы вторглись в зону удаления проекта, рекомендуется немедленно покинуть её!',
                    s.text,
                    s.btn
                )
            };
            doStep(0);
        },
        changePostPay: function( obj, cb ){
            var texts = {true: 'Постоплата', false: 'Предоплата'};
            dialog(
                'Способ оплаты',
                'Сейчас: '+ texts[!!obj.postPay],
                [
                    {text: texts.false, fn: function(){
                        Z.query('project','edit',{data: {id: obj.id,postPay: false}});
                        pHash[obj.id].postPay = false;
                        doSearch(true);
                        dialog('При предоплате можно указать отрицательный лимит проекта',
                            '<b>Лимит в рублях:</b> <input name="credit" type="text" placeholder="0" value="'+(Math.floor(obj.credit/100)||0)+'"><br>' +
                            '(Положительное число, на которое можно уйти в минус. Рублей)',
                            [
                                {text: 'Изменить', 'default': true, fn: function(){
                                    var input = this.body.find('input[name=credit]');
                                    var val = input.val();
                                    if(!(parseFloat(val)-val<0.1)){
                                        input.css({background:'#a00'});
                                        return false;
                                    }
                                    val = Math.round(parseFloat(val)*100);
                                    pHash[obj.id].credit = val;
                                    Z.query('project','edit',{data: {id: obj.id,credit: val}});
                                    doSearch(true);
                                }},
                                {text: 'Оставить как есть'}
                            ]);
                    }},
                    {text: texts.true, fn: function(){
                        Z.query('project','edit',{data: {id: obj.id,postPay: true}});
                        pHash[obj.id].postPay = true;
                        doSearch(true);
                    }},
                    {text: 'Не трогать', 'default': true}
                ]
            )
        },
        changeGate: function( obj, cb ){
            var gate = obj.gate || obj.smsGate;

            Z.query('sms','getConnections', {}, function( list ){
                var gates = [];
                list = list.data;
                for(var i in list){
                    gates.push({name: i, login: list[i]});
                }
                dialog(
                    'Изменить шлюз проента '+ obj.name,
                    'Выберите шлюз<br>' +
                    '<select>'+gates.map(function(el){
                        return '<option value="'+el.name+'"'+(gate===el.name?' selected':'')+'>'+el.name+': '+ el.login +'</option>';
                    }).join('')+'</select>',
                    [
                        {text: 'Изменить', 'default': true, fn: function(){
                            var input = this.body.find('select');
                            var val = input.val();
                            var d;
                            Z.query('project','edit',{data:d={id: obj.id, gate: val, smsGate: val}},function(){
                                Z.apply(pHash[obj.id],d);
                                cb('getGate');
                            });
                        }},
                        {text: 'Отмена'}
                    ]
                ).body.find('input').focus();
            });

        },
        addMoney: function( obj, cb ){
            dialog(
                'Пополнить счёт проекта '+ obj.name,
                'Введите сумму<br>' +
                '<input type="text" placeholder="0">',
                [
                    {text: 'Пополнить', 'default': true, fn: function(){
                        var input = this.body.find('input');
                        var val = input.val();
                        if(!(parseFloat(val)-val<0.1)){
                            input.css({background:'#a00'});
                            return false;
                        }
                        val = Math.round(parseFloat(val)*100)/100;
                        Z.query('balance','get',{owner: obj.id},function(a){
                           Z.query('balance','transaction',{id: 'THEWALLET', amount: val, to:a.data.id},function(a){
                               cb('getBalance');
                           });
                        });
                    }},
                    {text: 'Отмена'}
                ]
            ).body.find('input').focus();
        },
        apiRequests: function( obj, cb ){

            Z.query('log', 'get', {uid: obj._id},function(data){
                var div = document.createElement('div' ),
                    html = [];

                html.push('<div class="rList">');
                var req = data.data;/*project.filter( function( el ){
                    return el.creator === obj._id;
                } );*/
                !req.length && html.push('<span class="green">Обращений не было</span>')
                html.push( req.map( function( el ){
                    return itemsRenderer.request(el);
                } ).join('')+'</div>');
                div.innerHTML = (html.join('<br>'));
                var rList = $(div)
                    .find('.item' )
                    .click( function( el ){
                        rList.removeClass('active');
                        $(this).addClass('active');
                        var item = req[rList.index(this)];
                        route('request',item, 'right')
                    });

                cb(div);
            })
        },
        decMoney: function( obj, cb ){
            dialog(
                'Опустошить счёт проекта '+ obj.name,
                'Введите сумму<br>' +
                '<input type="text" placeholder="0">',
                [
                    {text: 'Опустошить', 'default': true, fn: function(){
                        var input = this.body.find('input');
                        var val = input.val();
                        if(!(parseFloat(val)-val<0.1)){
                            input.css({background:'#a00'});
                            return false;
                        }
                        val = Math.round(parseFloat(val)*100)/100;
                        Z.query('balance','get',{owner: obj.id},function(a){
                           Z.query('balance','transaction',{id: a.data.id, amount: val, to: 'THEWALLET'},function(a){
                               cb('getBalance');
                           });
                        });
                    }},
                    {text: 'Отмена'}
                ]
            ).body.find('input').focus();
        },
        getSerial: function( obj, cb ){
            Z.query('serial', 'get', {instance: obj.id}, function( data ){
                var div = document.createElement('div');
                div.innerHTML = '&nbsp;<i>Open:</i> '+ data.data.open +'<br>'+
                        '&nbsp;<i>Close:</i> '+ data.data.close +'<br>'
                cb(div);
            });
        },
        showCreator: function (obj, cb, i, id) {
            var item = uHash[obj.creator];
            route('user',item, 'right');
        },
        showCompany: function (obj, cb, i, id) {
            var item = cHash[obj.company];
            route('company',item, 'right');
        },
        getBalance: function( obj, cb ){

            Z.query('project', 'getBalance', {id: obj.id}, function( data ){
                var div = document.createElement('div');
                div.innerHTML = '&nbsp;<i>Число денег</i>: '+ data.data.amount +' руб<br>' +
                '&nbsp;&nbsp;<span class="action" data-act="addMoney">Добавить</span><br>' +
                '&nbsp;&nbsp;<span class="action" data-act="decMoney">Изъять</span><br>'
                cb(div);
            });
        },
        getGate: function( obj, cb ){
            var div = document.createElement('div');
            var o = pHash[obj.id]
            var gate = o.gate || o.smsGate;
            div.innerHTML = '&nbsp;<i>Шлюз</i>: '+ gate +'<br>' +
            '&nbsp;&nbsp;<span class="action" data-act="changeGate">Изменить</span><br>'
            cb(div);
        },
        getCosts: function( obj, cb ){
            Z.query('costs', 'getCosts', {pid: obj.id}, function( data ){
                var div = document.createElement('div' ), text = [];
                Z.each(data.data, function( key, val ){
                    text.push('&nbsp;<i>'+key+'</i>:<br>');
                    Z.each(val, function( k, v ){
                        console.log(v);
                        text.push('&nbsp;&nbsp;'+k+' цена: '+ v.price +'; бесплатных: '+ v.free+(v.pcid?' <span class="action" data-act="removeFromCosts" data-id="'+ v.pcid+'" data-name="'+k+'">[удалить]</span>':'')+'<br>');
                    });

                });
                text.push('&nbsp;<span class="action" data-act="addCosts">Добавить</span><br>');
                div.innerHTML = text.join('');
                cb(div);
            });
        },
        'hidden-toggler': function (obj, cb, el) {
            if(el.checked)
                $(el).next('.hiddable').fadeIn();
            else
                $(el).next('.hiddable').fadeOut();

        },
        getStats: function (obj, cb) {
            var quotes = {'\'':1,'"':2,'`':3},
                makeArr = function (text) {
                    return text.replace(/\(|\)|\-|\_|\+/g,'').split(/[,;\n\t]/).map(function(el){
                        var quot, out;
                        if((quot = quotes[el.charAt(0)]) && quot && quot === quotes[el.charAt(el.length-1)])
                            out = el.substr(1,el.length-2);
                        else
                            out = el;
                        return out.trim();
                    }).filter(function(el){return el !== '' && el !== void 0;});
                };

            var div = document.createElement('div' ),
                text = [];
            text.push('<form>')
            text.push('&nbsp;&nbsp;&nbsp;Гранулярность <select name="group"><option value="day" selected>День</option><option value="month">Месяц</option></select>');
            text.push('&nbsp;<input type="checkbox" class="action" data-act="hidden-toggler">&nbsp;From <input type="date" name="from" class="hiddable" name="from">');
            text.push('&nbsp;<input type="checkbox" class="action" data-act="hidden-toggler">&nbsp;To <input type="date" name="to" class="hiddable" name="to">');
            text.push('&nbsp;<input type="checkbox" class="action" data-act="hidden-toggler">&nbsp;Phone <div class="hiddable">Список телефонов. Разделитель - <b>новая строка</b> или <b>,</b> или <b>;</b> или <b>символ табуляции</b>. Номера можно писать в различных кавычках.<br><textarea style="width: 100%;height: 5em" name="phone"></textarea></div>');
            text.push('&nbsp;<input type="checkbox" class="action" data-act="hidden-toggler">&nbsp;MIDs <div class="hiddable">Список наших message-id. Разделитель - <b>новая строка</b> или <b>,</b> или <b>;</b> или <b>символ табуляции</b>. Числа можно писать в различных кавычках.<textarea style="width: 100%;height: 5em" name="mid"></textarea></div>');
            text.push('&nbsp;<input type="checkbox" class="doJSON">&nbsp;JSON');
            text.push('&nbsp;<input type="button" value="Генерируем">');
            text.push('</form>')

            div.innerHTML = text.join('<br>');
            $(div).find('[type=button]').click(function () {
                var $div = $(div),
                    els = {
                        from: $div.find('[name=from]'),
                        to: $div.find('[name=to]'),
                        phone: $div.find('[name=phone]'),
                        mid: $div.find('[name=mid]'),
                        group: $div.find('[name=group]')
                    }, q = {pid: obj.id};
                els.phone.parent().prev('[data-act=hidden-toggler]')[0].checked && (q.phone=makeArr(els.phone.val()));
                els.mid.parent().prev('[data-act=hidden-toggler]')[0].checked && (q.mid=makeArr(els.mid.val()));
                els.from.prev('[data-act=hidden-toggler]')[0].checked && (q.from=els.from.val());
                els.to.prev('[data-act=hidden-toggler]')[0].checked && (q.to=els.to.val());
                q.group=els.group.val();
                var form = document.createElement('form');
                form.method = "POST";
                form.action = "/api/statistic/report"+($('.doJSON')[0].checked?'Data':'');
                form.target = "_blank";
                var i = document.createElement('input');
                i.setAttribute('name', '$JSON$');
                i.value = JSON.stringify(q);
                form.appendChild(i);
                document.body.appendChild(form);
                form.submit();
                setTimeout(function () {
                    $(form).remove();
                },50);
                /*Z.query('statistic','report', q, function (data) {
                    debugger;
                    var d = dialog('Статистика по '+obj.name, data);
                    console.log(d);
                });*/
            });
            cb(div);
        },
        divOps: function (obj, cb) {

            dialog('Удаление элементов текущей зоны', 'Выбирите зону для сравнения <select class="divZone">'+
                operators.filter(function (el) {
                    return el.zone;
                }).map(function (el,i) {
                    return '<option value="'+el.id+'"'+(i==0?' selected':'')+'>'+(el.zone?'Z ':'')+ el.name+'</option>';
                })+
            '</select>', [
                {text: 'Удалить', 'default': true, fn: function(){

                    var val = this.body.find('select.divZone').val(),
                        data = operators.filter(function(el){return el.zone && el.id===val})[0].val;

                    var exist = Z.makeHash(obj.val,'id'),
                        remove = [];
                    data.forEach(function (el) {
                        if(exist[el.id]){
                            remove.push(el)
                        }
                    });
                    dialog('Удаление элементов', 'Будут удалены следующие элементы:<br> '+
                        remove.map(Z.getProperty('name')).join(', '),
                        [{
                            text: 'ОК', fn: function () {
                                remove.forEach(function (el) {
                                    Z.query('def','zone',{id: obj.id, val: el.id, action: 'add'},function(){
                                    });
                                });
                                var ids = Z.a2o(remove.map(Z.getProperty('id')));
                                obj.val =obj.__.val = obj.val.filter(function (el) {
                                    return !ids[el.id];
                                });
                                doSearch(true);
                            }
                        },{text: 'Отмена'}]);
                    }},
                    {text: 'Закрыть'}
            ])
        },
        copyOps: function (obj, cb) {

            dialog('Копирование зоны', 'Выбирите зону для копирования <select class="copyZone">'+
                operators.filter(function (el) {
                    return el.zone;
                }).map(function (el,i) {
                    return '<option value="'+el.id+'"'+(i==0?' selected':'')+'>'+(el.zone?'Z ':'')+ el.name+'</option>';
                })+
            '</select>', [
                {text: 'Добавить', 'default': true, fn: function(){

                    var val = this.body.find('select.copyZone').val(),
                        data = operators.filter(function(el){return el.zone && el.id===val})[0].val;

                    var exist = Z.makeHash(obj.val,'id'),
                        add = [];
                    data.forEach(function (el) {
                        if(!exist[el.id]){
                            add.push(el)
                        }
                    });
                    dialog('Копирование зоны', 'Будут добавлены следующие элементы:<br> '+
                        add.map(Z.getProperty('name')).join(', '),
                        [{
                            text: 'ОК', fn: function () {
                                add.forEach(function (el) {
                                    obj.val.push(el);
                                    Z.query('def','zone',{id: obj.id, val: el.id, action: 'add'},function(){
                                    });
                                });
                                doSearch(true);
                            }
                        },{text: 'Отмена'}]);
                    }},
                    {text: 'Закрыть'}
            ])
        },
        addCountry: function (obj, cb) {
            var countries = {};
            var used = Z.a2o(obj.val.filter(function (el) {
                return el.country;
            }).map(Z.getProperty('id')));
            if(obj.id.indexOf(':')>0){
                var tokens = obj.id.split(':');
                operators.filter(function (el) {
                    return el.zone && el.id.split(':')[0] === tokens[0];
                }).forEach(function (obj) {
                    Z.apply(used, Z.a2o(obj.val.filter(function (el) {
                        return el.country;
                    }).map(Z.getProperty('id'))));
                });
            }

            operators.forEach(function (el) {
                if(el.country){
                    countries[el.id] = el;
                }else if(el.zone){
                    el.val.forEach(function (el) {
                        if(el.country) {
                            countries[el.id] = el;
                        }
                    });
                }
            });
            var c = [];

            for(var i in countries)
                !used[countries[i].id] && c.push(countries[i]);

            var items = (c.sort(function (a, b) {
                        var a2 = a.name,
                            a1 = b.name;
                        return a1 > a2 ? -1 : a1 < a2 ? 1 : 0;
                    }));
            var counter;
            var d = dialog(
                'Добавить страну в `'+obj.name+'`',
                '<select class="main">'+
                    items.map(function(el,i){
                        return '<option value="'+el.id+'"'+(i==0?' selected':'')+'>'+(el.zone?'Z ':'')+ el.name+'</option>';
                    }).join('')+
                '</select> (<span class="count"><b>'+items.length+'</b></span>)<br>' +
                '<span class="action bonus"><b>Дополнительные настройки</b></span>' +
                '<div style="display:none" class="bonusBlock">' +
                'Исключить страны имеющиеся в зоне <select class="sub">'+
                    operators.filter(function (el) {
                        return el.zone;
                    }).map(function (el) {
                        return '<option value="'+el.id+'"'+(i==0?' selected':'')+'>'+(el.zone?'Z ':'')+ el.name+'</option>';
                    })+
                '</select><button class="substr">Исключить</button>' +
                '</div>',
                [
                    {text: 'Добавить', 'default': true, fn: function(){

                        var val = this.body.find('select.main').val();
                        obj.val.push(countries[val]);
                        doSearch(true);
                        this.body.find('select.main option[value="'+val+'"]').remove();
                        counter.html(counter.html()-1);
                        Z.query('def','zone',{id: obj.id, val: val, action: 'add'},function(){

                        });
                        return false;
                    }},
                    {text: 'Закрыть'}
                ]
            ).body;
            counter = d.find('.count b');
            d.find('select').focus();
            d.find('.bonus').click(function () {
                d.find('.bonusBlock').slideToggle();
            });
            d.find('.substr').click(function () {
                var val = d.find('.sub').val(),
                    main = d.find('select.main');

                var items = operators
                    .filter(function(el){return el.id===val})[0]
                    .val
                    .filter(function(el){return el.country;})
                    .map(function(el){
                        return main.find('option[value="'+el.id+'"]');
                    }).filter(function(el){
                        return el.length
                    });
                dialog('Исключить страны', items.map(function(el){return el.html();}).join(', ') + ' ('+items.length+')', [
                    {text: 'Исключить', fn: function () {
                        counter.html(counter.html()-items.length);
                        items.forEach(function(el){el.remove()});
                    }},
                    {text: 'Закрыть', 'default': true}
                ])

            });
        },
        addOpp: function (obj, cb) {
            var ops = {};
            var used = Z.a2o(obj.val.filter(function (el) {
                return !el.country;
            }).map(Z.getProperty('id')));
            if(obj.id.indexOf(':')>0){
                var tokens = obj.id.split(':');
                operators.filter(function (el) {
                    return el.zone && el.id.split(':')[0] === tokens[0];
                }).forEach(function (obj) {
                    Z.apply(used, Z.a2o(obj.val.filter(function (el) {
                        return el.country;
                    }).map(Z.getProperty('id'))));
                });
            }
            operators.forEach(function (el) {
                if(!el.country && !el.zone){
                    ops[el.id] = el;
                }else if(el.zone){
                    el.val.forEach(function (el) {
                        if(!el.country) {
                            ops[el.id] = el;
                        }
                    });
                }
            });
            var c = [];

            for(var i in ops)
                !used[ops[i].id] && c.push(ops[i]);
            dialog(
                'Добавить оператора в `'+obj.name+'`',
                '<select>'+(c.sort(function (a, b) {
                        var a2 = a.name,
                            a1 = b.name;
                        return a1 > a2 ? -1 : a1 < a2 ? 1 : 0;
                    }))
                    .map(function(el,i){
                        return '<option value="'+el.id+'"'+(i==0?' selected':'')+'>'+(el.zone?'Z ':'')+ el.name+'</option>';
                    }).join('')+
                '</select><br>',
                [
                    {text: 'Добавить', 'default': true, fn: function(){

                        var val = this.body.find('select').val();
                        obj.val.push(ops[val]);
                        doSearch(true);
                        this.body.find('select option[value="'+val+'"]').remove();
                        Z.query('def','zone',{id: obj.id, val: val, action: 'add'},function(){

                        });
                        return false;
                    }},
                    {text: 'Закрыть'}
                ]
            ).body.find('select').focus();
        },
        renameZone: function (obj, cb, el) {
            dialog(
                'Переименовать зону',
                '<b>Название</b> <input name="name" placeholder="Название зоны"><br>',
                [
                    {text: 'Переименовать', 'default': true, fn: function () {
                        var val = this.body.find('input[name=name]').val().trim();
                        if(val !== obj.id.trim()){
                            if(obj.val.length){
                                Z.query('def','zone',{id: obj.id, val: val, action: 'rename'},function(){

                                });
                            }else{
                                alert('Зоны без стран или операторов не сохраняются. Для того, что бы зона осталась нужно наполнить её чем-то до перезагрузки страницы!');
                            }
                            obj.__.id = obj.__.name = obj.id = obj.name = val;
                            urlBuilder({left: 'zone',left_id: val});
                            doSearch(true);

                        }
                    }},
                    {text: 'Оставить как было'}
                ]).body.find('input[name=name]').val(obj.id).focus();
        },
        removeFromCosts: function (obj,cb,el) {
            var id = el.getAttribute('data-id'),
                name = el.getAttribute('data-name');
            var n = (operators.filter(function(el){return el.id===name})[0]||{name:name}).name;

            dialog(
                'Удаление тариф?',
                'Безвозвратно удалить тариф `'+n+'` из проекта `'+obj.name+'`?',
                [
                    {text: 'Удалить', fn: function () {
                        Z.query('costs','removePack',{pid: obj.id, pcid: id},function(){
                            cb('getCosts');
                        });
                    }},
                    {text: 'Закрыть', 'default': true}
                ]
            );
        },
        removeFromZone: function (obj, cb, el) {
            var id = el.getAttribute('data-id');
            var item = operators.filter(function (el) {
                return el.id === id;
            })[0];
            dialog(
                'Удаление из зоны',
                'Безвозвратно удалить `'+item.name+'` из `'+obj.name+'`',
                [
                    {text: 'Удалить', fn: function () {
                        obj.val =obj.__.val = obj.val.filter(function (el) {
                            return el.id !== id;
                        });
                        doSearch(true);
                        Z.query('def','zone',{id: obj.id, val: item.id, action: 'remove'},function(){
                            cb('getCosts');
                        });
                    }},
                    {text: 'Закрыть', 'default': true}
                ]
            );
        },
        addCosts: function( obj, cb, el ){
            var pad = function (text,count) {
                text = text + '';
                return text.length < count ? new Array(count-text.length + 1).join('0')+text: text;
            };
            var list = operators;
            dialog(
                'Добавить тариф',
                'Внимание, нельзя указать и цену и количество бесплатных одновременно<br><b>Оператор</b><br>' +
                '<select>'+[
                    {id: 'default', name: 'default'}
                ].concat(list.slice().sort(function (a, b) {
                        var a1 = (a.zone?'1':'0') + pad(a.count||1,10),
                            a2 = (b.zone?'1':'0') + pad(b.count||1,10);
                        return a1 > a2 ? -1 : a1 < a2 ? 1 : 0;
                    }))
                    .map(function(el,i){
                        return '<option value="'+el.id+'"'+(i==0?' selected':'')+'>'+(el.zone?'Z ':'')+ el.name+'</option>';
                    }).join('')+'</select><br>' +
                '<b>Цена</b> <input name="price" placeholder="цена (копеек)"><br>'+
                '<b>Количество бесплатных</b> <input name="free" placeholder="" value="0"><br>',
                [
                    {text: 'Изменить', 'default': true, fn: function(){
                        var data = {
                            price: this.body.find('input[name=price]').val(),
                            free: this.body.find('input[name=free]').val(),
                            service: 'sms',
                            type: this.body.find('select').val()
                        };
                        Z.query('costs','addPack',{data:data,pid: obj.id},function(){
                            cb('getCosts');
                        });
                    }},
                    {text: 'Отмена'}
                ]
            ).body.find('input[name=price]').focus();


        }
    };
    Z.a2o = function( arr, val ){
            var i = 0, _i = arr.length,
                newVal = val || true,
                out = {};
            if( arr === null || arr === undefined ) return out;

            for( ; i < _i; i++ ){
                out[ arr[ i ] ] = newVal;
            }
            return out;
        };
    var system = Z.a2o(['tab','gate','smsGate', 'smsPrice','postPay','credit']);
    var actionize = function( el, obj, id ){
        console.log(el,obj);
        $(el).find('.action' ).off('click').click( function( e ){
            var $this = $(this);
            var act =  $this.attr('data-act');
            if( act === '' )return; // empty action
            doAct[act]( obj, function( res ){
                if( typeof res === 'string'){

                    var actionBtn = $(el).find('[data-act='+res+']');
                    if( !actionBtn )
                        throw 'no action button for '+res;
                    actionBtn.click();
                }else{
                    var resAct = act + '_result',
                        $el = $( res );
                    $el.attr( 'data-el', resAct );
                    if( $this.next().attr( 'data-el' ) === resAct )
                        $this.next().remove();
                    $this.after( res );
                    actionize( el, obj, id );
                }
            }, this, id);
        });
    };
    var drawer = {
        request: function( el, obj ){
            var html = ['<b>Запрос к '+
                '<span class="green">'+obj.module+'.'+obj.fn+'</span></b>',
            '<i>Дата</i> '+dateTimeSecondsFormatter(+new Date(obj.create_date)),
            '<b>Тело</b>',
            '<pre>'+ JSON.stringify(JSON.parse(obj.data),true,2)+'</pre>',
            '',
            '<b>Ответ</b>',
            '<pre>'+ JSON.stringify(JSON.parse(obj.r),true,2)+'</pre>',

            ];
            el.innerHTML = html.join('<BR>');
        },
        statistic: function( el, obj, id ){
            var html = [
                '<b>Статистика по </b>'+pHash[obj.owner].name
            ];
            Z.each(obj.stat, function( k, el ){
                var d = new Date(2014,1,1,0,0,0,0,0);
                var tokens = k.split('-');
                d.setYear(tokens[0]);
                tokens[1] && d.setMonth(tokens[1]-1);
                tokens[2] && d.setDate(tokens[2]);
                html.push(
                    monthFormatter(+d) + ':'+
                    '&nbsp;<span class="green">+'+currency(el.to)+'</span>'+
                    '&nbsp;<span class="red">&minus;'+currency(el.from)+'</span>'
                );
            });
            html.push('');
            html.push('<b>Связанные сущности</b>');
            html.push(itemsRenderer.project(pHash[obj.owner])+
                itemsRenderer.user(uHash[pHash[obj.owner].creator]));
            el.innerHTML = html.join('<br>');
            var items = $(el).find('.item' ).click( function(){
                items.removeClass('active');
                $(this).addClass('active');
                if(!items.index(this)){
                    route('project',pHash[obj.owner], 'right');
                }else{
                    route('user',uHash[pHash[obj.owner].creator], 'right');
                }
            });
            if( id === obj.owner )$(items[0]).click();
            if( id === pHash[obj.owner].creator )$(items[1]).click();

        },
        user: function( el, obj, id ){
            obj.group = obj.group || null;
            var html = ['<b>Пользователь</b> '+obj._id];
            for( var i in obj ){
                if( !system[i] && typeof i !== 'object' && (cheat ||(i+'').substr(0,1) !== '_' )){
                    html.push('<i>'+i+'</i>: '+wrap(obj[i],i));
                }
            }

            html.push('');
            html.push('<i>Проекты:</i><div class="pList">');
            var prjs = project.filter( function( el ){
                return el.creator === obj._id;
            } );
            html.push( prjs.map( function( el ){
                return itemsRenderer.project(el);
            } ).join('')+'</div>');

            html.push('<span class="action" data-act="apiRequests">-- Обращения к апи --</span>');
            console.log(obj);
            el.innerHTML = html.join('<br>');
            var pList = $(el)
                .find('.pList .item' )
                .click( function( el ){
                    pList.removeClass('active');
                    $(this).addClass('active');
                    var item = prjs[pList.index(this)];
                    route('project',item, 'right')
                });
            prjs.forEach( function( item, i ){
                if(id === item.id || id === item._id)
                    $(pList[i] ).click();
            });
            var edits = $(el).find('.js_value' ).dblclick( function( e ){
                var attr = $(this ).attr('data-type');
                var tmp = $(this ),
                    input = $('<input type="text">');
                tmp.after(input);
                input.css({
                    width: input.parent().width() - input.position().left
                });
                input.val(obj[attr]);
                input.focus();
                var intry = false;
                var trySaveChange = function(  ){
                    if(intry)
                        return false;
                    intry = true;

                    if( input.val() !== obj[attr] ){
                        if(confirm('Уверен ли ты, хочешь что изменить значение аттрибута `'+attr+'` с `'+ obj[attr] +'` на `'+input.val()+'`?')){
                            obj[attr] = input.val();
                            var data = {};
                            data[attr] = uHash[obj._id][attr] = obj[attr];
                            Z.query('authorize','setData',{id: obj._id,data:data});

                            tmp.html(input.val());
                            input.remove();
                            tmp.show();
                            doSearch(true);
                        }else{
                            input.focus();
                        }
                    }
                    intry = false;
                };
                input.blur( function(){
                    trySaveChange();
                } ).keydown( function( e ){
                    if( e.keyCode === 13 )trySaveChange();
                });
                tmp.hide();
            });
            actionize(el, obj);
        },
        project: function( el, obj, id ){
            var html = ['<b>Проект</b> '+obj.id];
            for( var i in obj ){

                if( !system[i] && typeof obj[i] !== 'object' && (cheat || (i+'').substr(0,1) !== '_' )){

                    html.push('<i>'+i+'</i>: '+wrap(obj[i]));
                }
            }
            html.push('');
            var creator = uHash[obj.creator] || {login: '<b>NULL</b>'};
            html.push('<i>Имя создателя</i>: <span class="action" data-act="showCreator">'+(creator.login || creator.email || creator.phone)+'</span>');
            html.push('<i>Компания</i>: '+(obj.company?'<span class="action" data-act="showCompany">'+(cHash[obj.company].name)+'</span>':'Нет компании'));

            html.push('');
            html.push('<i>Оплата</i>: <span class="action" data-act="changePostPay">'+(obj.postPay ? 'Постоплата' : 'Предоплата')+'</span>');
            obj.postPay === false &&
                    html.push('<i>Кредит</i>: '+((obj.credit||0)/100).toFixed(2)+' рублей</span>');
            html.push('');
            html.push('<span class="action" data-act="getSerial">-- Получить ключи --</span>');
            html.push('<span class="action" data-act="getBalance">-- Узнать баланс --</span>');
            html.push('<span class="action" data-act="getGate">-- Смс шлюз --</span>');
            html.push('<span class="action" data-act="getCosts">-- Тарифы --</span>');
            html.push('<span class="action" data-act="getStats">-- Статистика --</span>');
            html.push('<span class="action" data-act="projectRemove">-- <u>/!\\</u> Удалить проект<u>/!\\</u> --</span>');
            console.log(obj);


            el.innerHTML = html.join('<br>');
            Z.each(plugin.project, function( k, v ){
                var div = document.createElement('div' ),
                    sub = document.createElement('div');
                div.innerHTML = '<b>'+v.name +'</b>'+
                    '<div></div>';
                div.className = "plugin";
                if( !(k in obj) && v.empty )
                    obj[k] = v.empty();
                v.build.call(sub, obj[k], obj);
                $(div).find('div').append(sub);
                el.appendChild(div);
            });
            actionize(el, obj, id);


        },
        group: function( el, obj ){
            el.innerHTML = '<b>Группа</b> '+obj.name;
        },
        company: function (el, obj, id) {
            var html = ['<b>Компания</b> '+obj.id];
            var item = {};
            [
            {id: 'name',  type: 'text', text: 'Имя в системе', value: item.name, placeholder: 'Новая компания'},
            {id: 'shortName',  type: 'text', text: 'Короткое название', value: item.shortName, placeholder: 'Название, которое будет использоваться в url'},
            {id: 'fullName',  type: 'text', text: 'Полное наименование', value: item.fullName},
            {id: 'officialAddress',  type: 'textarea', text: 'Юридический адрес', value: item.officialAddress},
            {id: 'realAddress',  type: 'textarea', text: 'Физический адрес', value: item.realAddress},
            {id: 'inn',  type: 'text', text: 'ИНН', value: item.inn},
            {id: 'kpp',  type: 'text', text: 'КПП', value: item.kpp},
            {id: 'ogrn',  type: 'text', text: 'ОГРН', value: item.ogrn},
            {id: 'bill',  type: 'text', text: 'Расчетный счет р/с', value: item.bill},
            {id: 'bank',  type: 'text', text: 'Наименование банка', value: item.bank},
            {id: 'bik',  type: 'text', text: 'БИК', value: item.bik},
            {id: 'correspondenAccout',  type: 'text', text: 'к/c', value: item.correspondenAccout},
            {id: 'email',  type: 'email', text: 'Контактный email', value: item.email, tooltip: 'для получения закрывающих документов'},
            {id: 'phone',  type: 'phone', text: 'Телефон', value: item.phone},
            {id: 'gendir', type: 'text', text: 'Генеральный директор', value: item.gendir},
            {id: 'gendirRo', type: 'text', text: 'Генеральный директор (родительный падеж)', value: item.gendirRo},
            {id: 'gendirShort', type: 'text', text: 'Генеральный директор (сокращенно)', value: item.gendirShort}
            ].forEach(function (el) {
                 html.push('<i>'+el.text+'</i>: '+wrap(obj[el.id]||'',el.id));
            });


            actionize(el, obj);

            html.push('');
            html.push('<div class="c_owner item"><i>Создатель</i>: '+ itemsRenderer.user( uHash[obj.creator])+'</div>');

            html.push('<i>Проекты владельца:</i><div class="pList">');

            var prjs = project.filter( function( el ){
                return el.creator === obj.creator;
            } );
            html.push( prjs.map( function( el ){
                return itemsRenderer.project(el);
            } ).join('')+'</div>');
            el.innerHTML = html.join('<br>');

            $(el).find('.c_owner').click(function () {
                var item = uHash[obj.creator];
                route('user',item, 'right')
            });

            var pList = $(el)
                .find('.pList .item' )
                .click( function( el ){
                    pList.removeClass('active');
                    $(this).addClass('active');
                    var item = prjs[pList.index(this)];
                    route('project',item, 'right')
                });
            prjs.forEach( function( item, i ){
                if(id === item.id || id === item._id)
                    $(pList[i] ).click();
            });

        },
        zoneAdd: function () {
            operators.push({id:'Новая зона',name:'Новая зона', val: [], zone: true});
            setTimeout(function () {
                urlBuilder({left: 'zone',left_id: 'Новая зона'});
                doSearch(true);
                $('.instance .action[data-act=renameZone]').click();
                setTimeout(function () {
                    $('.dialog input[name=name]').val('');
                },10);
            },10);
        },
        zone: function (el, obj, id) {
            var html = ['<b>Зона</b> <span class="action" data-act="renameZone">'+obj.id+'</span>'];
            var country = obj.val.filter(function (el) {
                return el.country;
            }),
                ops = obj.val.filter(function (el) {
                    return !el.country;
                });
            html.push('', '<i>Страны ('+country.length+')</i>');
            country.forEach(function (el) {
                html.push(el.name+' <span class="action" data-act="removeFromZone" data-id="'+el.id+'">[удалить]</span>')
            });
            html.push('<span class="action" data-act="addCountry">+ Добавить страну</span>');

            html.push('', '<i>Операторы ('+ops.length+')</i>');
            ops.forEach(function (el) {
                html.push(el.name+' <span class="action" data-act="removeFromZone" data-id="'+el.id+'">[удалить]</span>');
            });
            html.push('<span class="action" data-act="addOpp">+ Добавить оператора</span>');

            html.push('', '<span class="action" data-act="copyOps">-- Скопировать из другой зоны --</span>');
            html.push('', '<span class="action" data-act="divOps">-- Удалить имеющиеся в другой зоне (из текущей) --</span>')

            el.innerHTML = html.join('<br>');
            actionize(el, obj, id);
        }
    };
    drawer.sender = drawer.project;
    var route = function( type, obj, pos ){
        var el, prop = {};

        prop[pos] = type;
        prop[pos+'_id'] = obj._id || obj.id;
        urlBuilder(prop);
        if(pos === 'right')
            el = $('.detail' ).html('')[0];
        else if(pos === 'left')
            el = $('.instance' ).html('')[0];
        drawer[type](el, obj, pos === 'left' && URIs.right_id);

    };
    var project, user, operators, pHash, pNameHash, uHash, uNameHash, company, cHash;
    /*var $cur = $('.cursor').html(
            (new Array(51))
            .join(
                (new Array(51))
                .join('&nbsp;')+'<br>'
            )
        ),
        curW = $cur.width()/50,
        curH = $cur.height()/50;
    $cur.html('&nbsp;');
    var inClick = false;
    $( document ).mousemove( function( e ){
        $cur.css({left: ((e.clientX/curW)|0)*curW,top: ((e.clientY/curH)|0)*curH });
    } ).click( function( e ){
        if( inClick )
            return ;
        inClick = true;
        $cur.hide();

        setTimeout( function(  ){
            var x = e.clientX, y = e.clientY;
            var clickEvent= document.createEvent('MouseEvents');

            clickEvent.initMouseEvent(
                'mousedown', true, true, window, 0,
                0, 0, x, y, false, false,
                false, false, 0, null
            );
            document.elementFromPoint(x, y).dispatchEvent(clickEvent);
            setTimeout( function(  ){
                $cur.show();
                inClick = false;
            },500);
        },500);
        return false;

    });*/
    Z.doAfter( function( cb ){


        Z.query( 'project', 'list', {}, function( data ){
            project = data.data;
            pHash = Z.makeHash( project, 'id' );
            pNameHash = Z.makeHash( project, 'name' );
            cb();
        } );
    }, function( cb ){
        Z.query( 'authorize', 'getAll', {}, function( data ){
            user = data.data;
            uHash = Z.makeHash( user, '_id' );

            cb();
        } );
    }, function( cb ){
        Z.query( 'company', 'getAll', {}, function( data ){
            company = data.data;
            cHash = Z.makeHash( company, 'id' );

            cb();
        } );
    }, function( cb ){
        Z.query( 'def', 'list', {}, function( data ){
            operators = data.data;


            cb();
        } );
    }, function(  ){
        var lastVal = '',
            timeout,
            list = $('.list'),
            drawList = function( data ){
                var html = '';
                data.forEach( function( el ){
                    html += itemsRenderer[el.__type](el);
                });
                list.html(html);
                var items = list.find('.item' ).click( function( e ){
                    list.find('.item' ).removeClass('active');
                    $(this ).addClass('active');
                    var el = data[list.children().index(this)];
                    route(el.__type,el,'left');
                });
                data.forEach( function( item, i ){
                    if(URIs.left_id === item.id || URIs.left_id === item._id)
                        $(items[i] ).click();
                });
            },
            doSearch = window.doSearch = function( changed ){
                var val = ps.val();
                if( lastVal !== val || changed ){
                    urlBuilder({q: val});


                    lastVal = val;
                    var data = [];
                    var q = {f:{}};
                    var low = val,
                        tokens = low.split(/group by/i);
                    if( tokens.length > 1 ){
                        q.group = tokens[1].trim();
                        low = tokens[0].trim().toLowerCase();
                    }
                    tokens = low.split(/\s/);
                    var inProp = false, key, prop;
                    for( var i = 0, _i = tokens.length; i < _i; i++ ){
                        var ind = tokens[i].indexOf(':');
                        if( inProp ){

                            if( ind > -1 ){
                                inProp = true;
                                q.f[key] = prop.join(' ');
                                prop = [];
                                key = tokens[i].substr(0, ind);
                            }else{
                                prop.push(tokens[i]);
                            }

                            if( i === _i - 1 ){
                                q.f[key] = prop.join(' ');
                            }
                        }
                        if( !inProp && ind > -1 ){
                            inProp = true;
                            key = tokens[i].substr(0, ind);
                            var v = tokens[i].substr(ind+1).trim();
                            if(v.length){
                                tokens[i] = v;
                                i--;
                            }
                            prop = [];
                        }
                    }
                    Z.doAfter( function( cb ){


                        if( q.f.statistic ){
                            var cfg = {};
                            q.f.from && (cfg.from = q.f.from);
                            q.f.to && (cfg.to = q.f.to);
                            Z.query('statistic','money',cfg, function(res){
                                res = res.data;
                                var wallet = {};
                                for( var i = 0, _i = res.length; i < _i; i++ ){
                                    var item = res[i];
                                    wallet[item.from] = wallet[item.from] || {};
                                    wallet[item.to] = wallet[item.to] || {};
                                    wallet[item.from][item.date] = wallet[item.from][item.date] || {};
                                    wallet[item.from][item.date].from = item.amount;
                                    wallet[item.to][item.date] = wallet[item.to][item.date] || {};
                                    wallet[item.to][item.date].to = item.amount;

                                }
                                var j, w;
                                for( i in wallet ) if(wallet.hasOwnProperty(i)){
                                    w = wallet[i];
                                    var from = 0, to = 0;

                                    for( j in w ) if(w.hasOwnProperty(j)){
                                        from -= -w[j].from || 0;
                                        to -= -w[j].to || 0;
                                    }
                                    if(i != 'null' && i)
                                    data.push({
                                        id: i,
                                        __type: 'statistic',
                                        from: from,
                                        to: to,
                                        stat: w,
                                        owner: i
                                    });
                                }
                                cb();
                            })
                        }else{
                            if( q.f.sender ){
                                var filter = q.f.sender;

                                project.forEach(function(p){
                                  if(!p.sender)return;
                                  p.sender.forEach(function(el){
                                    if(el.sender && el.sender.indexOf(filter)>-1 || filter=='*')
                                    data.push( Z.apply( {__type: 'sender', __: p, _name:el.sender}, p ) );
                                  });
                                });
                            }
                            if( q.f.user ){

                                var filter = q.f.user;
                                user.filter( function( el ){
                                    if( q.f.user === '*' )return true;
                                    if(
                                        (el.login + '').toLowerCase().indexOf( filter ) > -1 ||
                                        (el.email + '').toLowerCase().indexOf( filter ) > -1 ||
                                        (el.phone + '').toLowerCase().indexOf( filter ) > -1 ||
                                        (el._id + '').toLowerCase().indexOf( filter ) > -1
                                    )
                                        return true
                                } )
                                    .forEach( function( el ){
                                        data.push( Z.apply( {__type: 'user', __: el}, el ) );
                                    } );
                            }
                            if(q.f.zone){

                                var filter = q.f.zone;
                                operators.filter( function( el ){
                                    if(!el.zone) return false;
                                    if( q.f.zone === '*' )return true;

                                    return el.name.toLowerCase().indexOf( filter ) > -1;
                                } )
                                    .forEach( function( el ){
                                        data.push( Z.apply( {__type: 'zone', __: el}, el ) );
                                    } );
                                data.push({__type:'zoneAdd'});
                            }
                            if( q.f.company ){

                                var filter = q.f.company;
                                company.filter( function( el ){
                                    if( q.f.company === '*' )return true;
                                    var user = uHash[el.creator]
                                    if(
                                        (el.name + '').toLowerCase().indexOf( filter ) > -1 ||
                                        (el.creator + '').toLowerCase().indexOf( filter ) > -1 ||
                                        ( user && (
                                            (user.login + '').toLowerCase().indexOf( filter ) > -1 ||
                                            (user.email + '').toLowerCase().indexOf( filter ) > -1 ||
                                            (user.phone + '').toLowerCase().indexOf( filter ) > -1 ||
                                            (user._id + '').toLowerCase().indexOf( filter ) > -1
                                        ) )||
                                        (el._id + '').toLowerCase().indexOf( filter ) > -1
                                    )
                                        return true
                                } )
                                    .forEach( function( el ){
                                        data.push( Z.apply( {__type: 'company', __: el}, el ) );
                                    } );
                            }
                            if( q.f.project ){
                                var filter = q.f.project;
                                project.filter( function( el ){
                                    if( filter === '*' )return true;
                                    if(
                                        (el.name + '').toLowerCase().indexOf( filter ) > -1 ||
                                        (el.fullName + '').toLowerCase().indexOf( filter ) > -1 ||
                                        (el.id + '').toLowerCase().indexOf( filter ) > -1
                                    )
                                        return true
                                } ).forEach( function( el ){
                                    data.push( Z.apply( {__type: 'project', __: el}, el ) );
                                } );
                            }
                            cb();
                        }
                    }, function(  ){
                        if( q.group ){
                            var gFn = new Function('user,project','return '+ q.group+';');
                            var groups = {};
                            try{
                                data.forEach( function( a ){
                                    var group = gFn.call( a, uHash, pHash );

                                    (groups[group] = groups[group] || []).push( a );
                                } );

                                var d = [];
                                for( var i in groups ){
                                    if( groups.hasOwnProperty( i ) ){


                                        d.push( {__type: 'group', name: i} );
                                        groups[i].forEach( function( el ){
                                            el.tab = 2;
                                            d.push( el );
                                        } )
                                    }
                                }
                                data = d;

                            }catch(e){

                            }
                        }
                        drawList( data );
                    });
                }
            },
            ps = $( '#pSearch' ).on( 'change keyup mouseup', function(){
                var val = ps.val();
                if( lastVal !== val ){
                    clearTimeout( timeout );
                    timeout = setTimeout( doSearch, 100 );
                }
            } );
        var predef = $('.search_predefined' ).click( function(  ){
            predef.removeClass('selected');
            $(this).addClass('selected');
            var data = $(this ).attr('data');
            ps.val( data );
            ps.change();
        });

        urlDecoder();
        console.log(URIs);

        if(!URIs.q)
            $( predef[0] ).click();
        else{
            var match = predef.toArray().filter( function( el ){
                return el.getAttribute( 'data' ).trim() === URIs.q;
            } );
            if( match.length )
                $(match[0] ).click();
            else{
                ps.val(URIs.q);
                ps.change();
            }
        }
        //debugger;
        //$(predef[0] ).click();
        //ps.change();
    });
    plugin.init();