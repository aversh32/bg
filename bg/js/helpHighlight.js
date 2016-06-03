Z.apply(Z, {
    paddingsToArray: function( inText ){

        var lines = inText.replace(/\r/g,'').split('\n'),
            struct = {data:[]}, node = struct,
            i, _i, line, current = 0, last = 0, up = [], first = true, text, nodeType;

        for( i = 0, _i = lines.length; i < _i; i++ ){
            line = lines[i];
            text = line.trim();
            if( text ){
                current = line.match(/^\s*/)[0].length

                if(first){
                    last = current;
                    node.padding = current;
                    first = false;
                }
                if( last < current ){
                    up.push(node);
                    node = {data: [], type: nodeType, padding: current}
                    nodeType = '';
                    up[up.length - 1].data.push(node);
                }else if(last > current){
                    if( nodeType )
                        node.data.push(text);
                    nodeType = '';
                    while(current < node.padding){
                        node = up.pop();
                        if(!node){
                            node = struct;
                            break;
                        }
                    }
                }

                if( text.charAt(0) === '#' ){
                    nodeType = text;
                }else{
                    node.data.push(text);
                }
                last = current
            }
        }
        return struct;
    },
    _helpRenderers: {
        text: function( text ){
            return '<p>'+ text +'</p>';
        },
        'in': function( text ){
            var tokens = text.split(' - '),
                varName,
                varType,
                varText;
            tokens.length > 1 && (tokens[1] = tokens.slice(1).join(' - '));
            varText = (tokens[1]||'').trim();
            tokens = tokens[0].split(':')
            varName = (tokens[0]||'').trim();
            varType = (tokens[1]||'').trim();
            return '<div class="prop">'+
                '<span class="prop_name">'+ varName +'</span>'+
                '<span class="prop_type">'+ varType +'</span>'+
                '<span class="prop_description">'+ varText +'</span>'+
                '</div>';
        },
        js: function( text ){
            return text.replace(/var|for|function/g, function(a){
                return '<span class="js_key">'+a+'</span>'
            }).replace(/\(|\)|\{|\}/g, function(a){
                    return '<span class="js_brace">'+a+'</span>'
                })
        },
        ok: function( text ){
            var char = text.charAt(0); char !=='{' && char!=='[' && char!=='"' && (text = '"'+ text +'"');

            return '<span class="ok_answer">' +
            '<span class="js_brace">{</span>"error": false, "data": '+text+'<span class="js_brace">}</span>'+
            '</span>';
        },
        error: function( text ){
            var char = text.charAt(0); char !=='{' && char!=='[' && char!=='"' && (text = '"'+ text +'"');

            return '<span class="error_answer">' +
                '<span class="js_brace">{</span>"error": true, "data": '+text+'<span class="js_brace">}</span>'+
                '</span>';
        }
    },
    renderHelp: function( struct, baseType ){

        var node, i, _i, data, out = [], renderers = Z._helpRenderers, type, renderer;
        data = struct.data;

        baseType && out.push('<div class="block_'+baseType+'">');
        for( i = 0, _i = data.length; i < _i; i++ ){
            node = data[i];

            if( typeof node === 'string' ){
                renderer = renderers[baseType] || renderers.text;

                out.push(renderer(node));
            }else{
                var orig = (node.type||'').replace(/#/g,'');
                type = orig || baseType;
                node.type === '##' && (node.type = 'comment');
                if(orig === 'in')
                    out.push('<div class="args">Аргументы</div>');

                if(orig === 'errors')
                    out.push('<div class="errors">Ошибки</div>');


                if(orig.indexOf('can')===0)
                    out.push('lulza:'+orig);

                if(orig === 'ok')
                    out.push('<div class="ok_answer_title">Ответ</div>');
                out = out.concat(Z.renderHelp(node, type))
            }
        }
        baseType && out.push('</div>');
        return out;
    }

});
/*
var inText = '        Получение статистики по проекту\n'+
    '        #in#\n'+
    '            id:hash - project id\n'+
    '            data\n'+
    '                id:hash - same id\n'+
    '                ##\n'+
    '                    #html#\n'+
    '                        #title#\n'+
    '                            lulza\n'+
    '\n'+
    '                    #js#\n'+
    '                        {id: 5, data: {id:2,m:3}}\n'+
    '                        var i; for()\n'+
    '\n'+
    '\n'+
    '\n'+
    '                name:text - text name\n'+
    '                [lulza]\n'+
    '\n'+
    '                \n'+
    '            \n';
Z.renderHelp( Z.paddingsToArray(inText) ).join('\n')*/
