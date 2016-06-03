(function(  ){
    'use strict';
    var highlight = {
        json: (function(  ){
            var syntaxHighlight = function(json){
                return json.replace(/&/g, '&amp;').
                    replace(/</g, '&lt;').replace(/>/g, '&gt;' ).
                    replace(/("(\\u[a-zA-Z0-9]{4}|\\[^u]|[^\\"])*"(\s*:)?|\b(true|false|null)\b|-?\d+(?:\.\d*)?(?:[eE][+\-]?\d+)?)/g, function (match) {
                        var cls = 'number';
                        if (/^"/.test(match)) {
                            if (/:$/.test(match)) {
                                cls = 'key';
                            } else {
                                cls = 'string';
                            }
                        } else if (/true|false/.test(match)) {
                            cls = 'boolean';
                        } else if (/null/.test(match)) {
                            cls = 'null';
                        }
                        return '<span class="' + cls + '">' + match + '</span>';
                    });
            };
            return function( data ){
                try{
                    return syntaxHighlight( JSON.stringify( JSON.parse( data ), true, 2 ) );
                }catch(e){
                    return false;
                }
            }
        })(),
        plain: function( data ){
            return safeTagsReplace(data);
        }
    };


    Z.widgets['prettyFormatter'] = function( cfg ){

        var pretty = function( item ){
            var data = cfg.data;
            dataDiv.innerHTML = highlight[item.act](data);
        };
        var div;
        if( cfg.renderTo.childNodes.length ){
            div = document.createElement( 'div' );
            cfg.renderTo.appendChild( div );
        }else{
            div = cfg.renderTo;
        }
        var modes = [{
            act: 'plain',
            text: 'plain'
        },{
            act: 'json',
            text: '{JSON}'
        }];
        modes.forEach( function( item ){
            var el = document.createElement('div');
            $(el ).css({
                float: 'left',
                margin: '2px 5px 2px 0',
                padding: '2px 4px',
                background: '#537',
                color: '#fff',
                cursor: 'pointer'
            });
            el.innerHTML = item.text;
            el.onclick = pretty.bind(null, item);
            div.appendChild(el);
        });
        div.appendChild($('<div style="clear:both"></div>')[0]);
        var dataDiv = document.createElement('pre');
        pretty(modes[0]);
        div.appendChild( dataDiv )

    };
})();