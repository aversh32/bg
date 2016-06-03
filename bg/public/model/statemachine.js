Z.stateMachine = (function(){
    var currentState,
        mainMenuState;
    var states = {
            login: function( data ){
                if( data.error )
                    this.run('loginFail');
                else{
                    this.run('login');
                    return 'main';
                }
            },
            logout: function(  ){
                this.run('logout');
                return 'notLogged';
            },
            register: function( data ){
                if( data.error )
                    this.run('registerFail');
                else{
                    this.run('login');
                    return 'main';
                }
            },
            page: function( hash ){
                this.run('pageChange', hash);
            }
        },
        stateChange = function( from, to ){

            var fn;
            if(to === void 0){
                to = from;
                from = currentState;
            }
            console.info('State change '+ from + '>'+ to);

            (fn = Z.from[from]) && fn();

            currentState = to;
            (fn = Z.to[to]) && fn(from);
        };

    var hashChange = function( ){
        var hash = decodeURIComponent(window.location.hash);
        var data = hash.split('/' ).filter( function( el ){
            return el.trim() !== '' && el !== '#';
        });
        Z.currentHash = data;
        if( Z.user && Z.user.data && !Z.validate.phone(Z.user.data.phone) ){
            if(!data || !(({logout:1,about:1})[data[0]])) {
                data = ['profile'];
                $.gritter.add({text: 'Пожалуйста, укажите номер своего мобильного телефона'});
            }
        }

        if( data.length === 0 )
;
            //Z.stateMachine( 'main', {}, Z.run );
        else{
            if( data[0] === 'logout' ){
                Z.run('logout');
                Z.stateMachine( 'notLogged', {}, Z.run);
            }else
                Z.stateMachine( 'page',data, Z.run );
        }
    };
    DOM.ready(function(  ){
        Z.stateMachine( Z.user.data ? 'main' : 'notLogged', {}, Z.run);

        Z.menuInited = function(  ){
            if( Z.user.data )
                hashChange();

            if (("onhashchange" in window)) {
                window.onhashchange = hashChange;
            } else {
                var prevHash = window.location.hash;
                window.setInterval(function () {
                    if (window.location.hash != prevHash) {
                        prevHash = window.location.hash;
                        hashChange();
                    }
                }, 100);
            }
        };
    });

    return function(name, data, run){
        stateChange( name );
        var fn = states[name],
            newState = fn && fn.call({run: run}, data);
        if( newState && newState!== currentState )
            stateChange( newState );

    };
})();