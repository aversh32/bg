Z.title = function( text ){
    document.title = Z.localize(text);
};
var menu;
Z.menu = function( data ){
    var lastData = Z.menu.lastData;
    if( Z.isArray(data) )
        Z.menu.lastData = data;
    else if(lastData){
        lastData.forEach( function( el ){
            if( el.id === data )
                el.active = true;
            else
                delete el.active;
        });
        data = lastData;
    }
    menu = menu || document.getElementById('mainMenu');
    menu.innerHTML = DOM.tplRenderer('menu')(data);
};
var subMenu, hidden, emptySubMenu = true;

Z.subMenu = function( data ){
    console.log('sub');
    subMenu = subMenu || document.getElementById('subMenu');
    if(!Z.isArray(data) || data.length === 0){
        if( !hidden ){
            document.getElementById('fullLeftNav').style.zIndex = 1;
            var width = $(subMenu).width(),
                fn = function(  ){
                    $(subMenu).hide();
                };
            if( emptySubMenu )
                fn();
            $(subMenu).stop().css({'left':'-'+width+'px','margin-right':'-'+width+'px'}, fn);

        }
        $(subMenu).hide();
        hidden = true;
    }else{
        emptySubMenu = false;
        if(hidden && (Z.isArray(data) && data.length > 0)){
            var width = $(subMenu).width();
            $(subMenu).css({'left':'-'+width+'px','margin-right':'-'+width+'px'}).stop().animate({
                'left': '0px',
                'margin-right': '0px'
            });
            hidden = false;
        }
        $(subMenu ).show();
    }
    subMenu.innerHTML = DOM.tplRenderer('subMenu')( data );
};
var content;
Z.setContent = function( text ){
    content.innerHTML = text;
};
Z.content = function( text, data ){
    Z.currentPage = text;
    content = content || document.getElementById('content');
    Z.query({
        url: 'api/web/'+text,
        data: data
    }, function( data ){
        Z.setContent( data.data.content );
        if( data.data.js ){
            Function('',data.data.js)();
        }


    });
};