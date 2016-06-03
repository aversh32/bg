Z.from = {
    notLogged: function(  ){
        $('.b-side__container' ).removeClass('b-side__container_centered');
        $('.b-main__container' ).removeClass('b-main__container_slider-align');

    }
};
Z.to = {
    notLogged: function(  ){
        Z.title('title.notLogged');
        Z.menu([]);
        Z.subMenu([]);
        //document.location.hash = '/authorize/';
        Z.run('pageChange',['authorize']);

        $('.b-side__container' ).addClass('b-side__container_centered');
        $('.b-main__container' ).addClass('b-main__container_slider-align');
        document.getElementById('bottomMenu').innerHTML = DOM.tplRenderer('bottomMenu')([
        //    {id: 'enter', icon: 'big-exit', text: 'Вход', url: '/#/main/'},
            {id: 'about', icon: 'big-info', text: 'Информация', url: 'https://www.dropbox.com/s/v3wxo8dt9b0host/BG_Manual_last.pdf?dl=0'}
        ]);
    },
    main: function(){
        Z.title('title.logged');
        Z.query('access','getAvaliable', null, function( result ){
            Z.query('web','getMenu', {items: result.data}, function( result ){

                result.data.forEach( function( el ){
                    if( el.id === 'profile' ){
                        el.img = Z.user.data.avatar;
                    }
                });
                Z.menu( result.data );
                Z.menuInited();

                setTimeout( function(  ){
                    if( document.location.hash.length < 3 )
                        document.location.hash = '/projects/';
                },100);
            });
        });
        document.getElementById('bottomMenu').innerHTML = DOM.tplRenderer('bottomMenu')([
            {id: 'about', icon: 'big-info', text: 'Информация', url: '/#/about/'},
            {id: 'exit', icon: 'big-exit', text: 'Выход', url: '/#/logout/'}
        ]);
    },
    pageChange: function(  ){
        //debugger;
    }

};