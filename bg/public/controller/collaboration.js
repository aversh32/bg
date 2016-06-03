Z.controller.collaboration = {
    tpls: ['form','collaborate','list'],
    init: function(){
        this.route = [];
    },
    router: function(){
        var content = document.getElementById('content');
        var context = {user: Z.user.data};
        var subMenu = document.getElementById('subMenu');
        $(subMenu).stop().css({'left':'0px','margin-right':'0px'} ).hide();
        Z.query('collaborate', 'list', {},function(data){
            if( data.error === false){
                data = data.data;
                if( data && data.length ){
                    this.list = widgets.list({
                        renderTo: content,
                        canRemove: false,
                        title: 'Заявки для рассмотрения',
                        canAdd: false,
                        canEdit: false,
                        items: data,
                        itemTpl: 'collaborate',
        //                listSelector: '.js_list',
                        tpl: 'list',
                        idKey: '_id',
                        listeners: {
                            'action.ok': function( id, el ){
                                var item = this.itemsHash[id];
                                Z.query('collaborate','approve',{id: id}, function(res){
                                    $.gritter.add({text: 'Одобрение свершилось!'});
                                    this.remove([id]);
                                }.bind(this));
                            },
                            'action.fail': function( id, el ){
                                var item = this.itemsHash[id];
                                Z.query('collaborate','deny',{id: id}, function(res){
                                    $.gritter.add({text: 'Негодование выражено!'});
                                    this.remove([id]);
                                }.bind(this));
                            },
                            'action.information': function( id, el ){
                                var info = el.querySelector('.js_btn_information');
                                Z.query('collaborate','getInfo', {id: id}, function( result ){
                                    if( !result.error ){
                                        result = result.data;
                                        var div = document.createElement('div');
                                        div.innerHTML = [
                                            'Проект: '+ result.project.name,
                                            'Пользователь: '+ result.creator.login
                                        ].join('<br>');
                                        info.parentNode.replaceChild( div, info);
                                    }
                                });

                            }
                        }
                    });

                }
            }


        });
    }
};