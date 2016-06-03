(function(  ){
    'use strict';
    widgets.form.dataGetter.phones = function(  ){

    };
    var validate = function( text ){
        if(text.match(/^[0-9\+\(\)\-\s]*$/) !== null ){ // phone
            var phone = text.replace(/[\+\(\)\-\s]*/g,'');
            /*if( phone.charAt(0) === '8')
                phone = '7'+phone.substr(1);
            if( phone.charAt(0) !== '7')
                phone = '7'+ phone;
            if( phone.length === 11 )
                return true;*/
            if(phone.length>7 && phone.length<16)
                return 'phone';
        }

        if( Z.storage.contactLists )
            if( (Z.storage.contactLists.get('name', text) ) )
                return 'list';

        return false;
    };
    var formatPhone = Z.sanitize.phone;
    Z.widgets['js_phones_input'] = function( el ){
        var data = [];

        var input = el.querySelector('input[type=hidden]');
        var add = function( val, type ){
            var el = document.createElement('span');
            el.className = 'label label-'+(type==='list'?'success':'primary');
            if(type === 'phone'){
                var formatted = formatPhone(val);
                el.innerHTML = formatted.view;
                val = formatted.raw;
            }else{
                var searchResult = Z.storage.contactLists.get('name',val);
                if( !searchResult.length ){
                    return false;
                }

                val = searchResult[0].name;
                el.innerHTML = val;
            }
            if( data.map( Z.getProperty('value')).indexOf(val) > -1 )
                return;

            movableInput.parentNode.insertBefore(el, movableInput);
            data.push({value: val, type: type, el: el});
            updateInput();
        };
        var inUpdate = false;
        var updateInput = function(  ){
            if( !inUpdate ){

                input.value = data.map( Z.getProperty('value') ).join(';');
                $(input).trigger('change')

            }
        };
        $(input).change(function(){
            inUpdate = true;
            if(input.value !== data.map( Z.getProperty('value') ).join(';')){
                var el;
                while(el = data.pop())
                    el.parentNode.removeChild(el);
                input.value.split(';').forEach(function(prop){
                    var type;
                    if( type = validate(prop) ){
                        add(prop,type);
                    }
                });
                focused = data.length;
            }
            inUpdate = false;

        });
        var div = document.createElement('div');
        div.className = 'panel-body phone-input-panel';
        el.appendChild(div);
        var movableInput = document.createElement('input');
        movableInput.placeholder = input.placeholder;
        movableInput.className = 'movable_input form-control';
        div.appendChild(movableInput);
        var focused = 0;
        DOM.addListener(div, 'click', function(){
            setTimeout(movableInput.focus.bind(movableInput),5);
        });
        DOM.addListener(movableInput, 'focus', function(  ){
            DOM.addClass(div, 'focused-phone-input-panel');
            tryAutoComplete();

        });
        DOM.addListener(input,"focus", function(  ){
            movableInput.focus();
        });
        DOM.addListener(movableInput, 'blur', function( e ){
            DOM.removeClass(div, 'focused-phone-input-panel');
            autoDiv.style.display = 'none';
            if( movableInput.value.trim() !== '' )
                if( enterAction() === false )
                    e.preventDefault();
        });

        var previousFocused;
        var setFocus = function(  ){
            var previous,
                current = data[focused];
            current && current.el && (current.el.className ='label label-info');
            if( previousFocused !== focused )
                previous = data[previousFocused];

            previous && previous.el &&
                previous.el.parentNode !== null &&
                    (previous.el.className = 'label label-'+(previous.type==='list'?'success':'primary'));
            if( current )
                previousFocused = focused;
            else
                previousFocused = void 0;
        };
        var autoCompleteList = [],
            autoCompleteIndex = 0,
            autoDiv = document.createElement('ul');
        autoDiv.className='autoComplete list-unstyled';
        el.appendChild(autoDiv);
        var redrawAutoComplete = function(  ){
            autoDiv.innerHTML = DOM.tplRenderer('autoComplete')({items: autoCompleteList, active: autoCompleteIndex});
            $(autoDiv).width($(movableInput).width());
        };
        $(autoDiv ).on('mousedown','li', function(  ){
            var tmp = $(this.parentNode).find('li').index(this);
            if( tmp > -1 && tmp !== null ){
                autoCompleteIndex = tmp;
                enterAction();
            }

        });
        var tryAutoComplete = function(  ){
            var val = movableInput.value.trim().toLowerCase(),
                names = Z.makeHash(Z.storage.contactLists.data,'name'),
                values = autoCompleteList = [],
                hash = Z.makeHash(data,'value');
            for( var i in names ){
                if( names.hasOwnProperty( i ) ){
                    if( i.charAt(0) !== '_' ){
                        if( i.toLowerCase().indexOf(val) > -1 ){
                            if( !( names[i].name in hash ) )
                                values.push({value: names[i].name, type: 'list', raw: names[i].name});
                        }
                    }
                }
            }
            autoDiv.style.display = values.length ? 'block':'none';
            autoCompleteIndex = 0;
            redrawAutoComplete();
        };
        DOM.addListener(movableInput, 'keydown', function( e ){
            if( e.keyCode === 8 && movableInput.value === '' ){//backspace
                var inputFocus = false;
                if( focused === data.length ){
                    focused--;
                    inputFocus = true;
                }
                var item = data.splice(focused,1)[0];
                if( !item ) return;
                item.el.parentNode.removeChild( item.el );
                updateInput();
                focused--;
                if(focused < 0)
                    focused = 0;
                if( inputFocus )
                    focused = data.length;
                setFocus();
            }else if( e.keyCode === 38){
                e.preventDefault();
                autoCompleteIndex--;
                autoCompleteIndex<0 && (autoCompleteIndex = 0);
                redrawAutoComplete();
            }else if( e.keyCode === 40){
                e.preventDefault();
                autoCompleteIndex++;
                autoCompleteIndex >= autoCompleteList.length && (autoCompleteIndex = autoCompleteList.length - 1);
                redrawAutoComplete();
            }
        });
        var enterAction = function(  ){
            var val = movableInput.value.trim().toLowerCase();
            if(autoCompleteList[autoCompleteIndex])
                val = autoCompleteList[autoCompleteIndex].value.toLowerCase();
            var type;
            if( type = validate(val) ){
                if( add(val, type) === false ){
                    return false;
                }else{
                    movableInput.value = '';
                }


            }else{
                movableInput.className = 'movable_input movable_input-invalid'
            }

            focused = data.length;
        };
        DOM.addListener(movableInput, 'keyup', function( e ){
            movableInput.className = 'movable_input form-control';
            var empty = movableInput.value === '';
            if( e.keyCode === 27 ){
                movableInput.value = '';
            }else if( e.keyCode === 13 || e.keyCode === 10 ){
                enterAction();
                tryAutoComplete();
                e.preventDefault();
                e.stopPropagation();
            }else if( e.keyCode === 37 && empty ){
                focused--;
                focused<0 && (focused = 0);
                setFocus();
            }else if( e.keyCode === 39 && empty ){
                focused++;
                focused>data.length && (focused = data.length);
                setFocus();
            }else if( e.keyCode === 38 || e.keyCode === 40){
                ;
            }else{
                tryAutoComplete();
            }
        });

    };
})();