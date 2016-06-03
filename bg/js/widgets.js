var factory = function( cfg ){
    this.js = '';
    Z.apply( this, cfg );
}, o, counter = 0;
var defaultWidget = function( name, cfg ){
    this.exportTpl( name );
    counter++;
    this.js += 'window.DOM.ready(function(){ window.widgets[\''+name+'\']({' +
        'renderTo: document.getElementById(\'id-'+ counter +'\'),'+
        'data: '+ JSON.stringify(cfg) +' }); });';
    return '<div id="id-'+ counter +'"></div>';
};
var w = {//custom widgets

};
o = factory.prototype = {
    build: function( cfg ){
        if( w[ cfg.xid ] )
            return w[ cfg.xid ].call( this, cfg );
        else
            return defaultWidget.call(this, cfg.xid, cfg);
    },
    tpls: false,
    exportTpl: function( tplName ){
        if( this.tpl.tplGroup[tplName]){
            var grouped = this.tpl.tplGroup[tplName], i;
            for( i = grouped.length;i;)
                this.exportTpl(grouped[--i]);
        }else if( this.tpl.tplList[tplName] )
            this.js += 'w["'+tplName +'"]='+ this.tpl.tplList[tplName].f.toString() + ';';
        else
            return false;
        this.tpls = true;
    }
};
module.exports = function( cfg ){
    Z.apply( o, cfg );
    return {
        factory: function( cfg ){
            return new factory( cfg );
        }
    };
};
