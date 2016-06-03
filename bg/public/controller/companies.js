Z.controller.companies = {
    tpls: ['companyItem','menuList', 'standardLayout','tabs', 'form'],
    init: function(){
        this.getLists();
        this.reinit = true;
    },
    idKey: 'id',
    getLists: function(  ){
        Z.storage.load('companies', function( storage ){
            this.storage = storage;
            this.fire('listsLoaded');
        }.bind(this));
    /*
        var idKey = this.idKey;
        Z.query( 'company', 'list', void 0, function(data){
            this.companies = data.data;
            this.hash = Z.makeHash(data.data, idKey);
            this.namesHash = Z.makeHash(data.data, 'name');
            this.fire('loaded');
        }.bind(this))*/
    },

    updateMenu: function(  ){
        var subMenu = document.getElementById('subMenu');
        var controller = this;
        $(subMenu).stop().css({'left':'0px','margin-right':'0px'} ).show();


        this.list = widgets.list({
            renderTo: subMenu,
            addButton: 'Добавить компанию',
            canRemove: false,
            title: 'КОМПАНИИ',
            canAdd: true,
            canEdit: false,
            items: Z.clone(this.storage.data, true),
            itemTpl: 'companyItem',
            listSelector: '.js_list',
            tpl: 'menuList',
            itemName: 'компания',
            idKey: this.idKey,
            listeners: {
                addButton: function(  ){
					
                    var obj = {name:'Новая компания'};
                    Z.query('company','create', {data: obj}, function( data ){

                        obj.id = data.data;
                        Z.storage.companies.add( Z.clone(obj));
                        this.add(obj);
                        this.fire('action.edit', obj.id, this.itemMap[obj.id]);
                        document.location.hash = '/companies/'+obj.id+'/';
                        setTimeout(controller.focusTitle.bind(controller),10);
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
        tabChange: function( name ){
            this.currentTab = name;
            var tab = this.tabRenderer[name];
            if( tab )
                tab.call(this, document.getElementById('content'));
            else
                $.gritter.add({ text: 'Раздел не существует' });
        }
    },
    router: function( route ){
        this.route = route;
        this.listLoaded && this.navigate();
    },
    focusTitle: function(  ){


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

        listName = (this.route[0] || '').trim().toLowerCase() || 'new';

        if( listName === 'new' ){
            this.currentActive = void 0;
            this.fire('tabChange', 'new');
        }else{
            item = this.storage.get('id', listName);
            if(!item.length)
                return;
            item = Z.clone(item[0]);
            item.active = true;
            this.list.edit(item.id, item);
            if( this.currentActive !== item.id ){
                this.currentActive = item.id;
            }
            this.fire( 'tabChange', this.route[1] || 'about');
        }
    },
    tabRenderer: {
        'new': function( el ){
			console.log("Новая компания");
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
                    Z.storage.companies.add( Z.clone(lastData));
                    self.list.add(lastData);
                    document.location.hash = '/companies/'+data.data+'/';

                },
                data: {
                    change: function( id, val ){

                    },
					
                    cls: 'b-main__container b-main__container_centered b-main__container_spacer',
                    xid: 'form',
                    sendAs: 'data',
                    sendTo: 'api/company/create/',
                    items: [
                        {id: 'avatar', type: 'image', cls: 'center-image-upload btn-load', justImage: true},
                        {id: 'name', pencil: true, type: 'text', placeholder: 'Название компании', customInputCls: 'form-control bd0',groupCls: 'b-page-line input-group transperent col-xs-10 b-company__name'},
                        {type: 'submit', text: 'Создать компанию', cls: 'btn_next-step', just: true}
                    ]}
            });
            form.getInput('name').focus();
        },
        'about': function( content ){
            var item = this.storage.get('id', this.currentActive)[0],
                el = content;

            content.innerHTML = DOM.tplRenderer('standardLayout')({
                name: item.name,//'<input class="form-control big js_title_edit" value=""/>',
                canDelete: false
            });
/*
            DOM.addListener(content.querySelector('.big-remove-button'), 'click', function(  ){

                if( confirm(
                        'Вы уверены что хотите удалить компанию «'+
                        item.name +
                        '»?'
                    ) ){
                    Z.query('company','remove',{id: item.id});
                    document.location.hash = '/companies/';
                    Z.controller.companies.list.remove([item.id]);
                    Z.storage.companies.remove('id',item.id);
                    $('.b-main__container').children().slideUp();
                }
            });*/
            //this.buildTitleInput( el.querySelector('.js_title_edit'), Z.clone(item) );
            var controller = this;
            var lastData;
            var nameEl = content.querySelector('.b-main__title');
            var form = controller.form = widgets.form({
                renderTo: content.querySelector('.js_content' ),
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
                    sendTo: 'api/company/edit/',
                    xid: 'form',
                    change: function( name, val ){
                        /*if( name === 'name' ){

                            var obj = this.list.itemsHash[item.id];
                            if( obj.name !== name ){
                                if(val.trim().toLowerCase()==='')return;
                                obj.name = val;
                                this.list.edit(obj.id, obj);
                                this.hash[item.id].name = val;

                                nameEl.innerHTML = val;
                                form.edit('shortName', Z.translit(val));
                            }
                        }*/
                    }.bind(controller),
                    items: [
                        {id: 'id',  type: 'hidden', text: '', value: item.id},
                        {id: 'avatar',  type: 'image', text: 'Загрузить', value: item.avatar},
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
                        {id: 'gendirShort', type: 'text', text: 'Генеральный директор (сокращенно)', value: item.gendirShort},
                        {type: 'submit', text: 'Сохранить'}
                    ].map( function( el ){
                            el.bordered = true;
                            return el;
                        })
                }
            });
            var nameInput = controller.form.getInput('name');
            nameInput.focus();
            if(item.name==='Новая компания')
                nameInput.value = '';
            // TODO есть баг ухода без сейва. нужен конфирм

        }
    }
};
Z.observable(Z.controller.companies);