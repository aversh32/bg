Z.controller.about = {
    tpls: ['about'],
    init: function(){
        this.route = [];
        $(document.getElementById('content')).parents('.b-side__container:first').addClass('dark');
    },
    destroy: function(  ){
        $(document.getElementById('content')).parents('.b-side__container:first').removeClass('dark');
    },
    router: function(){
        var content = document.getElementById('content');
        var context = {user: Z.user.data};
        var subMenu = document.getElementById('subMenu');
        $(subMenu).stop().css({'left':'0px','margin-right':'0px'} ).hide();
        content.innerHTML = DOM.tplRenderer('about')();

    }
};

Z.observable(Z.controller.about);