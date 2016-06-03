(function () {
    'use strict';
    var drawOptions = function (el, items) {
        var html = '';
        for( var i = 0, _i = items.length; i < _i; i++ ){
            html += '<option value="'+items[i].id+'">'+items[i].name+'</option>'
        }
        el.innerHTML = html;
    };
    Z.widgets['js_select_input'] = function (el, cfg) {
        if(Z.isArray(cfg.items)){
            drawOptions(el, cfg.items);
        }else if(cfg.items instanceof Z.promise){
            cfg.items.after(function (store) {
                cfg.items = store;
                Z.widgets['js_select_input'](el, cfg);
            });
            return ;
        }else if(cfg.items instanceof Z.storage.proto){
            var map = cfg.map;
            var data = cfg.items.data;
            if(map)
                data = data.map(function(el){
                    var o = {};
                    for( var i in map )
                        if( map.hasOwnProperty(i) )
                            o[i] = el[map[i]];
                    return o;
                });
            if(cfg.sort) {
                var s = cfg.sort;
                data = data.sort(function (a, b) {
                    return a[s] < b[s] ? -1 : a[s] > b[s] ? 1 : 0;
                });
            }
            drawOptions(el, data);
        }
        if( cfg.firstSelect && !cfg.value && data[0] ){
            el.value = data[0].id;
        }else{
            el.value = cfg.value;
        }
    };
})();