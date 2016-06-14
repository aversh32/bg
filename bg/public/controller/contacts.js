Z.controller.contacts = {
    tpls: ['import_stats','contacts.export','csvUpload','contactItem','form','list','table','tabs', 'contactList','contactListMenuItem','standardLayout','projectMenuItem','menuList','projectItem'],
    init: function(){
        this.route = [];
        this.currentActive = null;
        this.getLists();
    },
    getLists: function(  ){
        Z.storage.load('contactLists', function( storage ){
            this.storage = storage;
            this.fire('listsLoaded');
        }.bind(this));
    },
    updateMenu: function(  ){


        var subMenu = document.getElementById('subMenu' ),
            storage = this.storage,
            controller = this;
        $(subMenu).stop().css({'left':'0px','margin-right':'0px'} ).show();
        this.list = widgets.list({
            renderTo: subMenu,
            canRemove: false,
            title: 'СПИСКИ',
            addButton: 'Добавить список',
            canAdd: true,
            items: Z.clone(this.storage.data, true),
            itemTpl: 'contactListMenuItem',
            listSelector: '.js_list',
            tpl: 'menuList',
            itemName: 'список',
            idKey: 'id',
            newItem: 'Новый список',
            listeners: {
                addButton: function(  ){
					console.log("Создание контакта");
                    var c, name = this.newItem;
                    while( storage.hash['name'][name] !== void 0 ){
                        c = (c||1)+1;
                        name = this.newItem + ' '+ c;
                    }

                    var obj = { name: name };
                    Z.query('contactList','create', {data: obj}, function( data ){
				
                        obj.id = data.data;
                        storage.add( obj );
                        this.add(obj);
                        this.fire('action.edit', obj.id, this.itemMap[obj.id]);
                        this.itemMap[obj.id].click();
                        setTimeout( function(){
                            controller.titleFocus();
                        },10);
                        $(subMenu).animate({
                            scrollTop: $(this.itemMap[obj.id]).offset().top
                        }, 1000);
                    }.bind(this));
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
            this.currentActive = void 0;
            //document.location.hash = '/contacts/'+item.name+'/'+ (this.activeTab || '');

            Z.query('contactList','edit', {id: item.id, data: {name: item.name}});


        },
        tabChange: function( name ){
            var el = document.getElementById('tab_'+ name);
            this.currentTab = name;
            var tab = this.tabRenderer[name];
            if( tab )
                tab.call(this, el, this.storage && this.currentActive && this.storage.get('id', this.currentActive)[0]);
            else
                $.gritter.add({ text: 'Раздел не существует' });
        }
    },
    tabRenderer: {
        'list': function( el ){
            Z.storage.load('contacts', function(  ){
			console.log("Новый контакт");

            var listId = this.currentActive,
                contacts = Z.storage.contacts.get('_list', listId );

            widgets.list({
                renderTo: el,
                actions: [{
                    id: 'delete',
                    text: 'Удалить',
                    img: 'mini-close'
                }],
                canRemove: true,
                canSearch: true,
                columns: [
                    {id: 'phone', name: 'Телефон', type: 'phone'},
                    {id: 'name', name: 'Имя', type: 'text'},
                    {id: 'email', name: 'Почта', type: 'email'}
                ],
                canAdd: true,
                tpl: 'table',
                listSelector: 'tbody',
                items: Z.clone(contacts,true),
                itemTpl: 'contactItem',
                itemName: 'контакт',
                idKey: 'id',
                listeners: {
                    'actionButton.delete': function( id ){
                        var item = this.itemsHash[id];

                        if( confirm(
                                'Вы уверены что хотите удалить контакт «'+
                                Z.sanitize.phone( item.phone ).view +
                                '»?'
                            ) ){
                            this.remove([item.id]);
                             Z.query('contactList','removeItem',{id: listId, data: {id: item.id}});

                        }
                    },
                    removeButton: function( idList ){
                        if( confirm('Вы уверены что хотите удалить '+ idList.length +' контактов?') ){
//
//                            this.remove(idList);
//                            var list = controller.hash[listId];
//                            list.length = (list.length || 0)-idList.length;
//                            idList.forEach( function( id ){
//                                Z.query('contactList','removeItem',{id: listId, data: {phone: id}});
//                            }.bind(this));
//                            controller.updateMenu();
                        }
                    },
                    addButton: function(  ){
                        var addBtn = $(this.els.js_add_button);
                        var thisList = this;
                        var lastData = {};
                        var div = document.createElement('div');
                        var form = widgets.form({
                            renderTo: div,
                            validate: function( data ){
                                lastData = Z.clone(data);
                                var wasError = false;
                                if(!data.agree){
                                    $( this.getInput('agree') ).parent().parent().addClass('alert alert-danger');
                                    wasError = true;
                                }
                                if(!wasError){
                                    var obj = { phone: data.phone, name: data.name, email: data.email };

                                    var o = {};
                                    for( var i in navigator )
                                        if( navigator.hasOwnProperty(i) && (
                                            {string:1,number:1}[typeof navigator[i]] || i === 'languages'))
                                                o[i] = navigator[i];
                                    var agreeData = {
                                        type: 'contact',
                                        data: {
                                            type: 'addContact',
                                            nav: o,
                                            screen: screen,
                                            contact: obj,
                                            lid: listId
                                        }
                                    };

                                    Z.query('agree','add', agreeData, function(  ){});
                                    Z.query('contactList','addItem', {id: listId, data: obj}, function( data ){
                                        obj.id = data.data;
                                        thisList.add(obj);
                                        var list = Z.storage.contactLists.get('id', listId)[0];
                                        Z.storage.contactLists.edit(
                                            list,
                                            {length: (list.length || 0) + 1}
                                        );
                                        Z.storage.contacts.add( Z.apply({_list: listId},obj));
                                        $(div).remove();
                                        addBtn.show();
                                        //$(this.itemMap[obj.id] ).find('td')[1].click();

                                    });

                                }
                                return false;
                            },
                            data: {
                                cls: 'js_new_contact_form',
                                xid: 'form',
                                items: [
                                    {type: 'header',header: 'Данные нового контакта', header_small: ''},
                                    {type: 'form-group', bordered: true},
                                    {id: 'phone',  type: 'phone', bordered: true, text: 'Телефон', value: ''},
                                    {id: 'name',  type: 'text', bordered: true, text: 'Имя', value: ''},
                                    {id: 'email',  type: 'email', bordered: true, text: 'Почта', value: '', placeholder: ''},
                                    {id: 'lid',  type: 'hidden', text: '', value: listId},
                                    {id: 'agree', type: 'checkbox', text: 'Пользователь дал своё согласие на получение рассылок по смс', description: ''},
                                    {type: 'submit', text: 'Сохранить', just: true},
                                    {id:'cancel', type: 'button', text: 'Отмена', just: true}
                                ]
                            }
                        });

                        addBtn.parent().parent().parent().after( div );
                        addBtn.hide();
                        $(form.getInput('cancel')).css({'margin-left':'10px'} ).click( function(  ){
                            $(div).remove();
                            addBtn.show();
                        });
                        $(form.getInput('phone' ).parentNode.parentNode).find('input:last').focus();


//                        var obj = {phone:'7'};
//                        var list = controller.hash[listId];
//                        list.length = (list.length || 0)+1;
//                        Z.query('contactList','addItem', {id: listId, data: obj}, function( data ){
//                            obj.id = data.data;
//                            this.add(obj);
//                            controller.updateMenu();
//                            this.fire('action.edit', obj.phone, this.itemMap[obj.phone]);
//                        }.bind(this));
                    },
                    'action.edit': function( data ){
                        data.data.id = data.id;
                        Z.storage.contacts.edit(
                            Z.storage.contacts.get( 'id', data.id )[0],
                            data.data
                        );

                        Z.query('contactList','editItem', {id: listId, data: data.data});
                    }

                }
            });
            }.bind(this));
        },
        'export': function( el ){
            var listId = this.currentActive;
            el.innerHTML = DOM.tplRenderer('contacts.export')({});
            var link = $('.export_link_js');
            link.attr('href',document.location.origin +'/api/contactList/export/?id='+listId);
        },
        'import': function( el ){
            var listId = this.currentActive;
            var id = Math.random().toString(36)+Math.random().toString(36);
            el.innerHTML = DOM.tplRenderer('csvUpload')({id: id});//this.currentActive});
            Z.iframeAnswer.on(id, function( data ){
                var tableEl = el.querySelector('.uploaded_table');
                var guesses = {
                    title: false,
                    columns: [],
                    splitter: ';'
                };
                var getArray = function( rows ){
                    var lines = data.split( '\n' ),
                        splitter = guesses.splitter,
                        trimedLines = lines.filter( function( el ){
                            return el.trim()!=='';
                        } ),
                        split = function( el ){
                            return el.split(splitter)
                        };
                    if(rows)
                        return trimedLines.slice( 0, rows ).map( split );
                    else
                        return trimedLines.map( split );
                };

                var test = getArray(),
                    row,
                    columns = [], match, dataEnums = {}, i,_i, j,_j, phones = 0, emails = 0, names = 0;
                if(test && test[0] && !test[0][1]){
                    guesses.splitter = ',';
                    var tryTest = getArray();
                    if( tryTest && tryTest[0] && tryTest[0][1])
                        test = tryTest;
                    else
                        guesses.splitter = ';';
                }

                for( j = 1,_j = test.length; j < _j; j++){
                    row = test[j];
                    for( i = 0, _i = Math.min(row.length,100); i < _i; i++ ){
                        var cell = row[i].replace(/\s*"\s*([^"]*?)\s*"\s*$/,'$1')
                        if( cell !== ''){
                            if( (match = cell.match(/^[0-9\+\(\)\-\s]*$/)) !== null && (match = match[0].replace(/[\+\(\)\-\s]*/g,'')) && match.length > 8 ){
                                columns.phone = columns.phone || {};
                                columns.phone[i] = (columns.phone[i] || 0)+1;
                                phones++;
                            }else if( cell.indexOf('@') > -1 ){
                                columns.email = columns.email || {};
                                columns.email[i] = (columns.email[i] || 0)+1;
                                emails++;
                            }else if( cell.length > 4 && cell.replace(/[а-яА-Яa-zA-Z ]/g,'') < 2 ){
                                columns.name = columns.name || {};
                                columns.name[i] = (columns.name[i] || 0)+1;
                                names++;
                            }
                            dataEnums[i] = dataEnums[i] || {};
                            dataEnums[i][cell] = (dataEnums[i][cell] || 0)+1;
                        }
                    }
                }
                var stats = [];
                for( i in dataEnums ){
                    if( dataEnums.hasOwnProperty(i) ){
                        var en = dataEnums[i],
                            sum = 0, count = 0;
                        for( j in en ){
                            if( en.hasOwnProperty( j ) ){
                                count++;
                                sum += en[j];
                                stats[i] = {count: count, sum: sum};
                            }
                        }
                    }
                }
                var named = false;
                for( i = 0, _i = stats.length; i < _i; i++ ){
                    var stat = stats[i];
                    if(columns.email)
                    if( columns.email[i] > emails*0.7 ){
                        guesses.columns[i] = 'email';
                    }
                    if(columns.phone)
                    if( columns.phone[i] > phones * 0.7 ){
                        guesses.columns[i] = 'phone';
                    }
                    if(columns.name)
                    if( columns.name[i] > names * 0.7 ){
                        guesses.columns[i] = 'name';
                        named = true;
                    }
                }
                if( !named ){
                    var maxDiffer = 0, maxDifferColumn;
                    for( i = 0, _i = stats.length; i < _i; i++ ){
                        stat = stats[i];
                        if( guesses.columns[i] === void 0 ){
                            if( stats[i] && stats[i].count > maxDiffer ){
                                maxDiffer = stats[i].count;
                                maxDifferColumn = i;
                            }
                        }
                    }
                    guesses.columns[maxDifferColumn] = 'name';
                }
                for( i = 0, _i = stats.length; i < _i; i++ ){
                    stat = stats[i];
                    if( guesses.columns[i] === void 0 ){
                        if( stats[i] && stats[i].count < 4 && stats[i].count > 1 ){
                            guesses.columns[i] = 'sex';
                            break;
                        }
                    }
                }
                for( i = 0, _i = stats.length; i < _i; i++ ){
                    if(guesses.columns[i] === 'email'){
                        if( test[0][i].indexOf('@') === -1 ){
                            guesses.title = true;
                        }
                    }
                    if(guesses.columns[i] === 'phone'){
                        if( test[0][i].match(/^[0-9\+\(\)\-\s]*$/) === null ){
                            guesses.title = true;
                        }
                    }
                }
                var addColumns = [];
                for( i = 0, _i = stats.length; i < _i; i++ ){
                    if( !guesses.columns[i] ){

                        var nameColumn = guesses.columns[i] = guesses.title? test[0][i] : 'Unknown '+(addColumns.length+1);
                        addColumns.push({ id: nameColumn, name: nameColumn, type: 'text'});
                    }

                }
                var redrawTable = function(  ){

                    var contacts = getArray();

                    var items = [], i, _i, j, _j;
                    if(guesses.title)
                        contacts = contacts.slice(1);
                    var match, phoneColumn, matching = 0, matchCount = 0, was = {};

                    for( i = 0; i < contacts.length; i++ ){
                        var contact = contacts[i];
                        var item = {};
                        for( j = 0, _j = guesses.columns.length; j < _j; j++){
                            var t = (contact[j]||'').replace(/\s*"\s*([^"]*?)\s*"\s*$/,'$1');
                            var field = guesses.columns[j];
                            if( field === 'phone' &&
                                    ((t||'').trim() !== '')
                                ){

                                phoneColumn = j;

                            }
                            field && (item[field] = t);
                        }
                        if( (item.phone||'').trim() !== '' && (item[guesses.columns[matching]] || '').trim()!== ''){

                            matchCount++;
                            if( matchCount === 3 ){
                                matchCount = 0;
                                do{
                                    matching++;
                                }while(guesses.columns[matching] === void 0 && matching > guesses.columns.length);
                                i = -1;
                                if( matching > guesses.columns.length )
                                    break;
                            }
                            if(!was[item.phone]){
                                items.push(was[item.phone] = item);
                            }
                        }


                    }

                    var countPhones = getArray().slice( guesses.title ? 1 : 0 ).map( function( el ){
                        return el[phoneColumn]
                    } ).filter( function( el ){
                        var match;
                        return ((el||'').trim() !== '');
                    } ).length;
                    var column = {
                        phone: {name: 'Телефон', formed: 'телефона'},
                        name: {name: 'Имя', formed: 'имени'},
                        email: {name: 'Email', formed: 'емэйла'},
                        sex: {name: 'Пол', formed: 'пола'}
                    };
                    addColumns.forEach( function( el ){
                        column[el.id] = el;
                        el.formed = el.name;
                    });
                    var list = widgets.list({
                        renderTo: tableEl,
                        canRemove: false,
                        canSearch: false,

                        columns: [
                            {id: 'phone', name: '<div class="btn-group column-js"></div>', type: 'phone'},
                            {id: 'name', name: '<div class="btn-group column-js"></div>', type: 'text'},
                            {id: 'email', name: '<div class="btn-group column-js"></div>', type: 'email'},
                            {id: 'sex', name: '<div class="btn-group column-js"></div>', type: 'text'}
                        ].concat(addColumns.map( function( el ){
                                var c = Z.clone(el);
                                c.name = '<div class="btn-group column-js"></div>';
                                c.type = 'text';
                                return c;
                        })),
                        canAdd: false,

                        tpl: 'table',
                        listSelector: 'tbody',
                        items: items,
                        itemTpl: 'contactItem',
                        itemName: 'контакт',
                        idKey: 'id'
                    });
                    var afterTableEl = el.querySelector('.afterTable_js');
                    afterTableEl.innerHTML = DOM.tplRenderer('import_stats')({count:countPhones});
                    DOM.addListener( afterTableEl.querySelector('.process_button'), 'click', function(  ){
                        if( $('input[name=agreement]:checked' ).length === 0 ){
                            $('input[name=agreement]' ).click( function(){
                                $(this ).parent().parent().css({background: 'auto'});
                            }).parent().parent().css({'background': '#a00'} );
                            return false;
                        }

                        var o = {};
                        for( var i in navigator )
                            if( navigator.hasOwnProperty(i) && (
                                {string:1,number:1}[typeof navigator[i]] || i === 'languages'))
                                    o[i] = navigator[i];

                        Z.query('agree','add', {
                            type: 'contacts',
                            data: {
                                type: 'import csv',
                                nav: o,
                                screen: screen
                            }
                        });

                        var strategy = $('[name=overwrite_type]:checked').val();
                        var originalContacts = Z.storage.contacts.get('_list', listId);


                        var contacts = getArray();

                        var items = [], i, _i, j, _j;
                        if(guesses.title)
                            contacts = contacts.slice(1);
                        var match, phoneColumn, matching = 0, matchCount = 0, was = {};
                        for( i = 0; i < contacts.length; i++ ){
                            var contact = contacts[i];
                            var item = {};
                            for( j = 0, _j = guesses.columns.length; j < _j; j++){
                                var t = (contact[j]||'').replace(/\s*"\s*([^"]*?)\s*"\s*$/,'$1');
                                var field = guesses.columns[j];
                                if( field === 'phone' &&
                                    ((t||'').trim() !== '')
                                    ){

                                    phoneColumn = j;

                                }
                                field.indexOf('Unknown') === -1 && field && (item[field] = t);
                            }
                            if( (item.phone||'').trim() !== ''){
                                items.push(was[item.phone] = item);
                            }
                        }
                        for( i = 0, _i = items.length; i < _i; i++ ){
                            item = items[i];
                            item.phone = item.phone.replace(/[\+\(\)\-\s]*/g,'');
                            if( item.phone.charAt(0) === '8')
                                item.phone = '7'+item.phone.substr(1);
                            else if( item.phone.charAt(0) !== '7')
                                item.phone = '7'+ item.phone;
                        }

                        if( strategy === 'update' ){
                            var originalHash = Z.makeHash( originalContacts, 'phone' ), original;
                            for( i = 0, _i = items.length; i < _i; i++ ){
                                item = items[i];

                                if( original = originalHash[item.phone] ){
                                    Z.apply(original, item);
                                    delete original.id;
                                }else{
                                    //item.id = Z.UUID.getRandom();
                                    item._list = listId;
                                    Z.storage.contacts.add(item);
                                }

                            }
                        }else{
                            Z.storage.contacts.remove('_list', listId);
                            for( i = 0, _i = items.length; i < _i; i++ ){
                                item = items[i];

                                //item.id = Z.UUID.getRandom();
                                item._list = listId;
                                Z.storage.contacts.add(item);
                            }
                        }
                        Z.storage.contactLists.get('id',listId)[0].length = Z.storage.contacts.get('_list', listId).length;
                        Z.storage.contactLists.fire('change');
                        var lData = Z.storage.contacts.get('_list',listId ).map( function( item ){
                                var clone = Z.clone(item);
                                delete clone._list;
                                return clone;
                            });
                        Z.query('contactList', 'edit', {id: listId, data: {list: lData.splice(0,1000)}}, function(  ){
                            var more = function(  ){
                                if(lData.length){
                                    Z.query('contactList', 'addItem', {id: listId,data: lData.splice(0,1000)}, function(  ){
                                        more();
                                    });
                                }else{
                                    var hash = location.hash.split('/').filter(function(el){return el.trim() !== '';});hash.pop();hash.push('list');
                                    document.location.hash = hash.join('/')+'/';
                                    setTimeout( function(){
                                        location.reload()
                                    },22);
                                }
                            };
                            more();


                        });


                        Z.storage.contacts.fire('change');
                        $('.js_tab:not(.active)').click();
                    });
                    Z.toArray(tableEl.querySelectorAll('.btn-group.column-js') ).forEach( function( el, i, all ){
                        var id = list.columns[i].id;

                        el.innerHTML = '<button type="button" class="btn btn-link btn-xs dropdown-toggle" data-toggle="dropdown">'+ column[id].name +'<span class="caret"></span></button>'+
                            '<ul class="dropdown-menu" role="menu">'+
                            Z.map( column, function( k, v ){
                                return k !== id ? '<li><a href="" data-id="'+k+'">Колонка '+v.formed+'</li>' : '';
                            } ).join('')+
                            '</ul>';
                        DOM.addListener(el, 'click', function( e ){
                            var dataId;
                            if( (dataId = e.target.getAttribute('data-id')) ){
                                guesses.columns = guesses.columns.map( function( el ){
                                    if( el === dataId )
                                        return id;
                                    else if( el === id )
                                        return dataId;
                                    else
                                        return el;
                                });
                                e.preventDefault();
                                e.stopPropagation();
                                redrawTable();
                            }else{
                                $( el ).addClass('open');
                            }
                            setTimeout( function(  ){
                                DOM.addOnceListener(document.body,'click', function( e ){
                                    $( el ).removeClass('open');
                                });
                            },10);
                        });
                    });
                    
                }.bind(this);
                redrawTable();
            }.bind(this));
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
    buildTabs: function( el ){
        var item = this.storage.get('id', this.currentActive)[0];
        el.url = '#/contacts/'+item.id+'/'+el.id +'/';
        el.content = '<div id="tab_'+ el.id +'"></div>';
        return el;
    },
    navigate: function(  ){
        if( this.route.length ){
            var listName, item;
            if( this.currentActive ){
                item = Z.clone(this.storage.get('id', this.currentActive )[0]);
                if(item){
                    item.active = false;
                    this.list.edit(item.id, item);
                }
            }

            listName = this.route[0].toLowerCase();
            item = Z.clone(this.storage.get('id', listName)[0]);
            if( !item )
                return;
            item.active = true;
            this.list.edit(item.id, item);
            if( this.currentActive !== item.id ){
                this.currentActive = item.id;
                var content = document.getElementById('content');
                content.innerHTML = DOM.tplRenderer('standardLayout')({
                    name: '<input class="form-control big js_title_edit" value=""/>',
                    canDelete: true
                });

                var input = content.querySelector('.js_title_edit');
                DOM.addListener(content.querySelector('.big-remove-button'), 'click', function(  ){

                    if( confirm(
                            'Вы уверены что хотите удалить список контакт «'+
                            item.name +
                            '»?' +(item.length?'Он содержит '+item.length+' '+
                                Z.pluralForm(item.length+',запись,записи,записей')
                                :'Этот список пуст')+'.'
                        ) ){
                        Z.query('contactList','remove',{id: item.id});
                        document.location.hash = '/contacts/';
                        Z.controller.contacts.list.remove([item.id]);
                        Z.storage.contactLists.remove('id',item.id);
                        $('.b-main__container').children().slideUp();
                    }
                });
                this.buildTitleInput( input, item );

                var currentTab = this.route[1] || 'list';

                var tabs = widgets.tabs({
                    renderTo: content.querySelector('.js_content'),
                    active: currentTab,
                    change: this.fire.bind(this, 'tabChange'),
                    data: [
                        {id: 'list', name: 'Список'},
                        {id: 'import', name: 'Импорт'},
                        {id: 'export', name: 'Экспорт'}
                    ].map( this.buildTabs.bind(this) )
                });
            }


        }else{
            var content = document.getElementById('content');
            content.innerHTML = ''
        }

    }
};
Z.observable(Z.controller.contacts);