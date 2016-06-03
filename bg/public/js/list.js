(function(  ){
    var List = function( cfg ){
        Z.apply(this, cfg);
        this.init();
    };
    var formatPhone = function( text ){
        var phone = (text||'').trim().replace(/[\+\(\)\-\s]*/g,'');
        if(phone === '')
            return {raw: '', view: ''};
        if( phone.charAt(0) === '8')
            phone = '7'+phone.substr(1);
        else if( phone.charAt(0) !== '7')
            phone = '7'+ phone;


        return {raw: phone, view: phone.length < 3 ? '' : '+'+ phone.substr(0,1)+'('+phone.substr(1,3)+')'+phone.substr(4,3)+'-'+phone.substr(7,2)+'-'+phone.substr(9,2)};

    };
    List.prototype = {
        tpl: 'list',
        listSelector: 'ul',
        redrawItem: function( id, item ){
            var renderer = DOM.tplRenderer(this.itemTpl ),
                div, itemMap = this.itemMap, oldEl = itemMap[id];
            delete itemMap[id];
            if( !this.columns ){
                div = document.createElement('div');
                div.innerHTML = renderer(item);
                this.list.replaceChild( itemMap[item[this.idKey]] = div.childNodes[0], oldEl )
            }else{
                var itemMap = this.itemMap, idKey = this.idKey,
                    j, _j, columns = Z.clone(this.columns, true ), column
                _j = columns.length;
                for(j=0; j < _j; j++){ // to fn
                    columns[j].renderer = columns[j].type==='phone'? function( val ){
                        return formatPhone(val ).view;
                    }:function(text){ return text; };
                }


                div = document.createElement('tr');
                for(j=0; j < _j; j++){
                    column = columns[ j ];
                    column.text = column.renderer(item[column.id]);
                }

                div.innerHTML = renderer({columns: columns, actions: this.actions.map( function( el ){
                    return '<i class="icon '+el.img+'" alt="'+ el.text +'"></i>';
                } ).join('\n')});
                this.list.replaceChild( itemMap[item[this.idKey]] = div, oldEl )

            }
        },

        _itemRenderMethods: {
            columns: function(){
                var fragment,
                    renderer = DOM.tplRenderer(this.itemTpl), i = this.renderedCount, _i, items = this.items,
                    div, el, itemMap = this.itemMap, idKey = this.idKey, list = this.list,
                    j, _j, columns = Z.clone(this.columns, true ), column, firstTime = i === 0,
                    actions = this.actions ? this.actions.map( function( el ){
                        return '<i class="icon '+el.img+'" alt="'+ el.text +'"></i>';
                    } ).join('\n') : '';
                _j = columns.length;
                for(j=0; j < _j; j++){
                    columns[j].renderer = columns[j].type==='phone'? function( val ){
                        return formatPhone(val ).view;
                    }:function(text){ return text; };
                }

                if( firstTime ){
                    fragment = document.createElement('tbody');
                }else{
                    fragment = list;
                }
                for( i = this.renderedCount, _i = items.length; i < _i; i++ ){
                    el = items[i];
                    div = document.createElement('tr');
                    for(j=0; j < _j; j++){
                        column = columns[ j ];
                        column.text = column.renderer(el[column.id]);
                    }

                    div.innerHTML = renderer({columns: columns, actions: actions});
                    fragment.appendChild( itemMap[el[idKey]] = div );
                }
                if( firstTime ){
                    this.list.parentNode.replaceChild(fragment, this.list);
                    this.list = fragment;
                    this.listClick && this.listClick.remove();
                    this.listClick = DOM.addListener(this.list,'click',this.resolveClick.bind(this));
                }

                this.renderedCount = _i;

            },
            title: function(){
                var fragment = document.createDocumentFragment(),
                    renderer = DOM.tplRenderer(this.itemTpl ), i, _i, items = this.items,
                    div, el, itemMap = this.itemMap, idKey = this.idKey;
                for( i = this.renderedCount, _i = Math.min(items.length, i + 220); i < _i; i++ ){
                    el = items[i];
        
                    div = document.createElement('div');
                    div.innerHTML = renderer(el);
                    fragment.appendChild( itemMap[el[idKey]] = div.childNodes[0] );
                }
                this.renderedCount = _i;
                //var els = Z.toArray(fragment.childNodes);
                this.list.appendChild(fragment);

                //$(els).hide().slideDown();
                if( _i < items.length ) // lazy load
                    setTimeout(this.renderItems.bind(this), 1);
            }
        },
        init: function(  ){

            this.renderedCount = 0;
            this.selectedHash = {};
            this.selectedCount = 0;
            this.itemMap = {};
            this.items = this.items || [];
            this.itemsHash = Z.makeHash(this.items,this.idKey);

            this.renderTo.innerHTML = DOM.tplRenderer(this.tpl)(this);
            this.list = this.renderTo.querySelector(this.listSelector);
            this.listeners && this.on(this.listeners);
            this.renderItems = this._itemRenderMethods[this.columns ? 'columns' : 'title'];
            this.renderItems();

            this.els = Z.findItems(this.renderTo, ['js_list_search','js_remove_button','js_add_button', 'js_select_all']);
            this.listClick && this.listClick.remove();
            this.listClick = DOM.addListener(this.list,'click',this.resolveClick.bind(this));
            this.els.js_select_all && DOM.addListener(this.els.js_select_all,'click',this.toggleSelect.bind(this));
            this.els.js_add_button && DOM.addListener(this.els.js_add_button,'click',this.addButtonClick.bind(this));
            this.els.js_remove_button && DOM.addListener(this.els.js_remove_button,'click',this.removeButtonClick.bind(this));
            this.els.js_list_search && this.initSearch(this.els.js_list_search);
            this.on('action.check', this.checkAction );
            this.on('action.edit', this.editAction );
            this.on('action.click', this.rowClick );

        },
        initSearch: function( el ){
            var lastValue = '', idKey = this.idKey, items = this.items, itemMap = this.itemMap;
            var change = function(){
                var val = el.value.trim().toLowerCase();
                if( lastValue !== val ){
                    lastValue = val;
                    for( var i = 0, _i = items.length; i < _i; i++ ){
                        var item = items[i], needRow = val === '';
                        if( !needRow )
                        for(var j in item ){
                            if( j.charAt(0) !== '_' && ((item[j]||'')+'').toLowerCase().indexOf(val) > -1 ){
                                needRow = true;
                                break;
                            }

                        }

                        itemMap[ item[idKey ]].style.display = needRow ? '' : 'none';

                    }

                }
            };
            'change,mouseup,keyup'.split(',').forEach( function( name ){
                DOM.addListener(el, name, change);
            });
        },
        rowClick: function( id, el, e ){
            var target = e.target,
                main = el, previous;
            if( target.parentNode !== el && target.parentNode.parentNode !== el )
                return;

            var cell = Array.prototype.indexOf.call(el.childNodes, target.tagName === 'TD' ? target : target.parentNode )-(this.actions?1:0),
                column = this.columns[cell],
                cellEl = el.childNodes[cell+(this.actions?1:0)];

            if( cell === -1 ){
                this.fire('actionButton.'+this.actions[0].id, id);
                return;
            }
            cellEl.innerHTML = '<input type="text" class="table-control">';
            var input = cellEl.childNodes[0], item = this.itemsHash[id],
                idKey = this.idKey,
                originalId = item[idKey],
                originalValue = input.value = item[column.id] || '';

            input.focus();


            var changed = function(  ){
                item[column.id] = input.value;
            };
            setTimeout(input.focus.bind(input),10);
            DOM.addListener(input,'mouseup', changed);
            DOM.addListener(input,'change', changed);
            DOM.addListener(input,'keyup', changed);
            var oked = false,
                self = this;
            var ok = function(  ){
                if( !oked ){
                    oked = true;
                    setTimeout( function(  ){
                        var data = {};
                        data[column.id] = item[column.id];
                        self.fire('action.edit', {id: originalId, data: data});
                        self.edit(id, item);
                    }, 0);
                }
            };
            DOM.addListener(input,'mousedown', function( e ){
                e.stopPropagation();
            });
            DOM.addListener(input,'click', function( e ){
                e.stopPropagation();
            });
            DOM.addListener(input,'blur', ok);
            DOM.addListener(input,'keydown', function( e ){
                if( e.keyCode === 13 ){
                    this.blur();
                    ok();
                }else if( e.keyCode === 27 ){
                    oked = true;
                    input.value = item[column.id] = originalValue;
                    setTimeout( function(  ){
                        self.redrawItem(originalId, item);
                    }, 0 );
                    //ok();
                }
            });

        },
        removeButtonClick: function( e ){
            e.stopPropagation();
            e.preventDefault();
            this.fire('removeButton', Z.map(this.selectedHash, function( key ){
                return key;
            }));
        },
        addButtonClick: function( e ){
            if( !this.addLink ){
                e.stopPropagation();
                e.preventDefault();
            }
            this.fire('addButton');
        },
        checkAction: function( id ){
            this[this.selectedHash[id] ? 'deselect' : 'select'](id);
        },
        editAction: function( id ){

        },
        add: function( obj ){
            this.items.push( obj );
            this.itemsHash[ obj[this.idKey] ] = obj;
            this.renderItems();

        },
        remove: function( list ){
            var items = this.items, idKey = this.idKey;
            list.forEach( function( id ){
                for( var i = items.length; --i;)
                    if( items[i][idKey] === id )
                        items.splice(i,1);
                delete this.itemsHash[id];
                delete this.selectedHash[id];
                var el = this.itemMap[id];
                $( el ).slideUp( function(  ){
                    el.parentNode.removeChild(el);
                }.bind(this));

                delete this.itemMap[id];
                this.renderedCount--;
            }.bind(this))
        },
        toggleSelect: function( e ){
            var idKey = this.idKey;
            if( this.selectedCount < this.items.length ){ // select all
                this.items.forEach( function( el ){
                    !this.selectedHash[el[idKey]] && this.select(el[idKey]);
                }.bind(this));
            }else{//deselect all
                this.items.forEach( function( el ){
                    this.selectedHash[el[idKey]] && this.deselect(el[idKey]);
                }.bind(this));
            }

        },
        select: function( id ){

            if(!this.selectedHash[id]){
                var item = this.itemMap[id];
                item && (item.querySelector('input[type=checkbox]' ).checked = true);
                this.selectedHash[id] = this;
                this.selectedCount++;

            }
        },
        deselect: function( id ){
            if(this.selectedHash[id]){
                var item = this.itemMap[id];
                item && (item.querySelector('input[type=checkbox]' ).checked = false);
                delete this.selectedHash[id];
                this.selectedCount--;
            }
        },
        allSelected: false,

        resolveClick: function( e ){
            var target = e.target,
                main = this.renderTo,
                action, previous,
                id, el, itemMap = this.itemMap;

            if(!this.columns)
                while( target !== main && target !== null ){
                    if(DOM.hasClass(target,'checkbox')){
                        action = 'check';
                        break;
                    }
                    if(DOM.hasClass(target,'js_edit_icon')){
                        action = 'edit';
                        break;
                    }
                    if( target.className.indexOf('js_btn_') > -1 ){
                        action = target.className.match(/js_btn_([^\s]*)/)[1];
                        break;
                    }
                    /*if(DOM.hasClass(target,'js_btn_ok')){
                        action = 'ok';
                        break;
                    }
                    if(DOM.hasClass(target,'js_btn_fail')){
                        action = 'fail';
                        break;
                    }*/

                    target = target.parentNode;
                }
            if( action || this.columns ){

                while( target !== this.list && target !== null){
                    previous = target;
                    target = target.parentNode
                }
                for( id in itemMap )
                    if( (el = itemMap[id]) === previous )
                        break;
                if( el === previous ){
                    this.fire('action.'+(action||'click'), id, el, e);
                    e.stopPropagation();
                    e.preventDefault();
                }
            }

        },
        edit: function( id, item ){
            var selected = false,
                newId = item[this.idKey];
            this.itemsHash = Z.makeHash(this.items,this.idKey);
            if( this.selectedHash[id] === true ){
                delete this.selectedHash[id];
                selected = true;
                this.selectedHash[newId] = true;
            }
            this.redrawItem(id, item);
            if( selected )
                this.select(newId);
        }
    };
    Z.observable(List.prototype);
    widgets.list = function( cfg ){
        return new List(cfg);
    };

})();
