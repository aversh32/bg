(function(  ){
    'use strict';

    Z.widgets['js_phone_input'] = function( el ){
        var data = [];

        var input = el.querySelector('input[type=hidden]');

        var rawValue = input.value;
        var inUpdate = false;
        var div = document.createElement('div');
        el.appendChild(div);
        var movableInput = document.createElement('input');
        movableInput.placeholder = input.placeholder;
        movableInput.className = 'form-control';
        movableInput.value = Z.sanitize.phone(rawValue).view;
        div.appendChild(movableInput);

        var focused = 0;
        DOM.addListener(div, 'click', function(){
            setTimeout(movableInput.focus.bind(movableInput),5);
        });
        DOM.addListener(movableInput, 'focus', function(  ){
            DOM.addClass(div, 'focused-phone-input');
            movableInput.value = rawValue;
        });
        DOM.addListener(input,"focus", function( e ){
            movableInput.focus();
        });
        DOM.addListener(movableInput, 'blur', function( e ){
            DOM.removeClass(div, 'focused-phone-input');
            rawValue = input.value = movableInput.value;
            movableInput.value = Z.sanitize.phone(rawValue).view;
        });


        DOM.addListener(movableInput, 'keydown', function( e ){
            if( e.keyCode === 8 && movableInput.value === '' ){//backspace

            }else if( e.keyCode === 38){

            }else if( e.keyCode === 40){

            }else if( e.keyCode === 13 ){
                this.blur();
            }
        });
        var enterAction = function(  ){

        };
        DOM.addListener(movableInput, 'keyup', function( e ){
            if( e.keyCode === 27 ){

            }else if( e.keyCode === 13 || e.keyCode === 10 ){

            }else if( e.keyCode === 37 && empty ){

            }else if( e.keyCode === 39 && empty ){

            }else if( e.keyCode === 38 || e.keyCode === 40){

            }else{

            }
        });

    };
})();