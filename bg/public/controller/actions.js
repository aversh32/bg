(function(  ){
    var currentHash;
    var actions = {
        login: function(  ){
            Z.cookie.set('u', this.data);
            Z.query('authorize','getUserByHash', {hash: this.data}, function( data ){
                Z.user.data = data.data;
                setTimeout( function(  ){
                    document.location.hash = '/profile/';
                    Z.to.main();
                },100);
            });

        },
        logout: function(  ){
            Z.cookie.set('u', '');
            Z.user = {
                data: null
            };

            Z.loadTpls(['animatedTabs'], function(){
                Z.stateMachine('notLogged');
                setTimeout( function(  ){
                    document.location.hash = '';
                },100);
            })

        },
        loginFail: function(  ){
            Z.msg('Incorrect login or password');
        },
        pageChange: function( hash ){
            Z.menu(hash[0]);
            if( Z.controller[hash[0]] ){
                if(currentHash !== hash[0]){
                    var controller = Z.controller[currentHash];
                    if(controller && controller.destroy && controller.destroy()===false)
                        console.log('destroy '+currentHash);
                    else{

                        controller = Z.controller[currentHash = hash[0]];
                        Z.loadTpls(controller.tpls || [], function(  ){
                            controller.init();
                            controller.router(hash.slice(1));
                        });
                    }

                }else{
                    Z.controller[currentHash].router(hash.slice(1));
                }
            }else{
                currentHash = hash[0];
                Z.subMenu([]);
                Z.content(hash[0] || 'profile');
            }
        }
    };
    Z.run = function( name ){
        actions[name].apply( this, Z.toArray( arguments ).slice(1) );
    }
})();