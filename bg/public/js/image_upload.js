(function(  ){
    var randomName = function(  ){
        return (new Array(4))
            .join('.')
            .split('')
            .map(function(){ return Math.random().toString(36).substr(3); })
            .join('');
    };
    var onloadFile = function (input, fn) {
            var sid = 'frm_' + randomName(),
                iframe = $('<iframe />', {
                    id: sid,
                    name: sid,
                    src: 'about:blank'
                }),
                form = $('<form />', {
                    method: 'POST',
                    encoding: 'multipart/form-data',
                    enctype: 'multipart/form-data',
                    action: '/uploadImage',
                    target: sid
                } );


            var newInput = input.clone();
            input.before(newInput);
            form.append(input);
            $(input ).attr('name', 'avatar');
            DOM.addListener(newInput[0], 'change', function () {
                onloadFile(newInput, fn);
            });

            newInput.bind('change', function() {
                onloadFile(newInput, fn);
            });


            iframe.css({ display: 'none' });
            form.css({ display: 'none' });
            document.body.appendChild(form[0]);
            document.body.appendChild(iframe[0]);

            if (document.frames) {
                document.frames[sid].name = sid;
            }

            iframe.on('load', onUploadedFile.bind({input: input, fn: fn}, iframe[0], form[0], input, sid));
            form[0].submit();
         },
        onUploadedFile = function (iframe, form, input, sid) {

            var iv = input.val(),
                fileName = iv.substr(Math.max(iv.lastIndexOf('\\'), iv.lastIndexOf('/')) + 1),
                objs = [];
            var doc = (iframe.contentDocument && iframe.contentWindow.document) || iframe.contentDocument || (window.frames[sid] && window.frames[sid].document);
            if (!doc) return;

            var res = doc.body.innerHTML;
            if (!res) return;
            var data = eval('(' + res + ');');
            this.fn && this.fn(data);
            input.val('');
            document.body.removeChild(form);
            document.body.removeChild(iframe);


        };
    Z.widgets['js_avatar_upload'] = function( el ){
        var input = el.querySelector('input[type=file]'),
            img = el.querySelector('.js_image_preview' ),
            hidden = document.createElement('input');
        //hidden.value = img.getAttribute('src');
        hidden.setAttribute('type', 'hidden');
        hidden.setAttribute('name', input.getAttribute('name'));
        img.parentNode.appendChild(hidden);
        DOM.addListener(input, 'change', function () {
            onloadFile($(input), function( data ){
                var newImg = document.createElement('img');

                hidden.value =  data.data.path;
                var div = document.createElement('div');
                div.innerHTML = '<figure class="avatar big b-round b-round_220 b-round-form js_image_preview" style="background-image: url('+hidden.value+')"></figure>'
                img.parentNode.replaceChild(div.childNodes[0],img);
                img = el.querySelector('.js_image_preview' )
            });
        });
    };
    Z.widgets['js_company_select'] = function( el ){
        var input = el.querySelector('input[type=hidden]');
        Z.doAfter( function( callback ){
            Z.loadTpls(['companySelect'], callback);
        }, function( callback ){
            Z.storage.load('companies', function( storage ){
                callback();
            });
        }, function(  ){
            var div = document.createElement('div');
            var data = Z.storage.companies.data;

            div.innerHTML = DOM.tplRenderer('companySelect')( data );
            var checks = Z.toArray(div.querySelectorAll('checkbox'));
            var recollect = function(  ){
                input.value = checks.filter( function( el ){
                    return el.checked;
                } ).map( function( el ){
                    return el.name;
                } ).join(',');
            };
            'click, mouseup,keyup'.split(',' ).forEach( function( name ){
                DOM.addListener(el, name, recollect);
            });
            el.appendChild(div.childNodes[0]);
            if( data.length === 0 )
                el.style.display = 'none';

        });
        
        
        
    }
})();