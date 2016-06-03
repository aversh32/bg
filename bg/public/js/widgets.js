(function(){
    var tagsToReplace = {
        '&': '&amp;',
        '<': '&lt;',
        '>': '&gt;'
    };

    function replaceTag(tag) {
        return tagsToReplace[tag] || tag;
    }

    window.safeTagsReplace = function(str){
        return str.replace(/[&<>]/g, replaceTag);
    }
})();
window.w = {};
window.LogicTplUnit=function(e){this.f=e};LogicTplUnit.prototype={ctor:function(e){this.f=e},c:{},
    collectorPop:function(e){return this.c[e].pop()},collectorGetLast:function(e){return this.c[e][this.length-1]},
    collectorNew:function(){for(var e=arguments.length;e;){this.c[arguments[--e]]=[]}return""},collectorPush:
        function(e,t){this.c[e].push(t);return""},o:function(e){var t=toString.call(e);if(t==="[object Array]"){
        var n={};for(var r=0,i=e.length;r<i;r++)n[r]=e[r];return n}else if(t==="[object Object]"){return e}return{}},
    l:Object.keys?function(e){var t=toString.call(e);if(t==="[object Array]"){return e.length}else
    if(t==="[object Object]"){return Object.keys(e).length}}:function(e){var t=toString.call(e);
        if(t==="[object Array]"){return e.length}else if(t==="[object Object]"){var n=0;for(var r in e)
            if(e.hasOwnProperty(r))n++;return n}},formatText:function(e){return e.replace(/\n/g,"<BR>").replace(/\t/g,"    ")}};
window.DOM = {
    init: function(){
        if (typeof window.addEventListener === 'function') {
            this.addListener = function (el, type, fn) {
                el.addEventListener(type, fn, false);
                return {remove: DOM.removeListener.bind(DOM, el, type, fn)};
            };
            this.removeListener = function (el, type, fn) {
                el.removeEventListener(type, fn, false);
            };
        } else if (typeof document.attachEvent === 'function') { // IE
            this.addListener = function (el, type, fn) {
                el.attachEvent('on' + type, fn);
                return {remove: DOM.removeListener.bind(DOM, el, type, fn)};
            };
            this.removeListener = function (el, type, fn) {
                el.detachEvent('on' + type, fn);
            };
        } else { // older browsers
            this.addListener = function (el, type, fn) {
                el['on' + type] = fn;
                return {remove: DOM.removeListener.bind(DOM, el, type, fn)};
            };
            this.removeListener = function (el, type) {
                el['on' + type] = null;
            };
        }
    },
    addOnceListener: function( el, type, fn ){
        var wrapFn = function(){
            window.DOM.removeListener(el, type, wrapFn);
            fn.apply( this, Array.prototype.slice.call( arguments ) );
        };
        this.addListener( el, type, wrapFn);
    },
    removeClass: function( el, name ){
        el.className = ((' '+el.className+' ').replace( ' '+name+' ', ' ')).trim();
    },
    addClass: function( el, name ){
        !this.hasClass( el, name ) && (el.className += ' '+ name);
    },
    hasClass: function( el, name ){
        return (' '+el.className+' ').indexOf( ' '+name+' ' ) > -1;
    },
    toggleClass: function( el, name ){
        this[ (this.hasClass(el, name) ? 'remove' : 'add' ) + 'Class' ]( el, name );
    },
    getOffset: function( target ){
        target = target || this.target;
        var left = this.pageX,
            top = this.pageY,
            width = target.offsetWidth,
            height = target.offsetHeight;

        if (target.offsetParent) {
            do {
                left -= target.offsetLeft;
                top -= target.offsetTop;
            } while( target = target.offsetParent );
        }
        return [left, top, width, height];
    },
    getXY: function( e ){
        if ( e.pageX == null && e.clientX != null ) {
            DOM.getXY = function( e ){
                var eventDoc = e.target.ownerDocument || document,
                    doc = eventDoc.documentElement,
                    body = eventDoc.body;

                return {
                    x: e.clientX + ( doc && doc.scrollLeft || body && body.scrollLeft || 0 ) - ( doc && doc.clientLeft || body && body.clientLeft || 0 ),
                    y: e.clientY + ( doc && doc.scrollTop  || body && body.scrollTop  || 0 ) - ( doc && doc.clientTop  || body && body.clientTop  || 0 )
                };
            };
        }else{
            DOM.getXY = function( e ){
                return {
                    x: e.pageX,
                    y: e.pageY
                }
            };
        }
        return DOM.getXY( e );
    },
    _readyList: [],
    inited: false,
    ready: function( fn ){
        this._readyList.push(fn);
        this._ready();
    },
    _ready: function(  ){
        if( this.inited ){
            while( this._readyList.length ){
                this._readyList.shift()();
            }
        }
    },
    tplRenderer: function( name ){
        var obj = new LogicTplUnit( w[name] );
        return function(data){return obj.f(data || {});};
    }
};
DOM.init();
var dateFormatter = function( date ){
        var dat = new Date( parseInt(date) );
        return dat.getDate() + ' '+ ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"][dat.getMonth()] +' ' + dat.getFullYear()
    },
    dateTimeFormatter = function( date ){
        var dat = new Date( parseInt(date) );
        return dateFormatter( date ) + ' ' + dat.getHours() + ':' + ('0'+dat.getMinutes()).substr(-2);
    };

window.widgets = {
    regSlider: function(  ){
        var regSlider = {
            elReg: $(".b-tab-slider"),
            elText: $(".b-tab-slider-text"),
            elList: $(".b-tab-slider-list"),
            active: null,
            init: function() {
                if (this.active === null) {
                    regSlider.slideTo(0);
                }
                this.a = this.elText.children('a').on('click', function() {
                    regSlider.slideTo($(this).index());
                });
            },
            slideTo: function(to) {
                this.fire('slideTo', to);
                var link, marginSize, _centerBox, _tW;
                this.active = to;
                link = this.elText.children('a');
                link.removeClass('active').eq(to).addClass('active');
                _tW = 0;
                _centerBox = Math.round(this.elReg.width() / 2);
                if (to !== 0) {
                    link.each(function(ind, el) {
                        if (ind < to) {
                            _tW += $(el).outerWidth(true);
                        }
                    });
                }
                this.elReg.width();
                this.elText.animate({
                    'left': _tW * -1
                }, 600);
                marginSize = 0;
                if (to !== 0) {
                    marginSize = 1000;
                }
                this.elList.animate({
                    'left': (600 * to + marginSize * to) * -1
                }, 600);
                console.info('marginSize', marginSize);
                console.info('_tW', _tW);
                console.info(to);
            }
        };
        Z.observable(regSlider);
        regSlider.init();

        return regSlider;
    },
    tabs: function( cfg ){
        cfg.renderTo.innerHTML = DOM.tplRenderer('tabs')(cfg.data);
        var items = Z.toArray(cfg.renderTo.querySelectorAll('.js_tab'));
        var contents = Z.toArray(cfg.renderTo.querySelectorAll('.js_pane'));
        var names = cfg.data.map( function( el ){
            return el.id;
        });
        items.forEach( function( el, i ){

            DOM.addListener(el, 'click', function( e ){
                DOM.removeClass(contents[names.indexOf(cfg.active)],'active');
                DOM.removeClass(contents[names.indexOf(cfg.active)],'in');
                DOM.removeClass(items[names.indexOf(cfg.active)],'active');
                cfg.active = names[i];
                cfg.change && cfg.change(cfg.active);
                DOM.addClass(contents[names.indexOf(cfg.active)],'active');
                DOM.addClass(contents[names.indexOf(cfg.active)],'in');
                DOM.addClass(items[names.indexOf(cfg.active)],'active');
            })
        });
        cfg.change && cfg.change(cfg.active);
        DOM.addClass(contents[names.indexOf(cfg.active)],'in');
        DOM.addClass(items[names.indexOf(cfg.active)],'active');

        return cfg;
    },
    form: (function(  ){

        var out = function( cfg ){
            var dataGetter = out.dataGetter;

            cfg.renderTo.innerHTML = DOM.tplRenderer('form')(cfg.data);
            var map = {};
            cfg.data.items.forEach(function (el, i) {
                if( el.id ) {
                    map[el.id] = el;
                    map['input_'+el.type+el.id+i] = el;
                }
            });
            var form = $(cfg.renderTo ).find('form');
            var inputs = form.find('input, textarea, select');
            inputs.on('change keyup mouseup', function(  ){
                cfg.data.change && cfg.data.change(this.name, this.value, this);
            });
            var canSubmit = false;
            form.submit( function( e ){
                if( !canSubmit ){
                    e.preventDefault();
                    return ;
                }
                canSubmit = false;
                var data = {};



                form.find('input, textarea, select').toArray().forEach(function(el){
                    var name;
                    if( el.type !== 'file' && el.type !== 'submit' && el.type !== 'button' && (name = el.getAttribute('name')))
                        data[name] = dataGetter[el.type] ? dataGetter[el.type](el) : dataGetter.def(el);
                });

                if( cfg.validate && !cfg.validate(data) )
                    return false;

                if( cfg.data.sendAs ){
                    var tmp = data;
                    data = {};
                    data[cfg.data.sendAs] = tmp;
                }
                Z.query({
                    url: cfg.data.sendTo,
                    state: cfg.data.state,
                    data: data,
                    error: function( data ){
                        return cfg.error && cfg.error(data);
                    }
                },function( data ){
                    return cfg.success && cfg.success(data);
                });

                return false;
            });

            cfg.edit = function( id, val ){
                inputs.filter('[name='+id+']' ).val(val);
            };
            cfg.getInput = function( id ){
                return inputs.filter('[name='+id+']' )[0];
            };
            cfg.submit = function(  ){
                canSubmit = true;
                form.submit();
                setTimeout(function(){canSubmit = false;},32)
            };
            form.find('button[type=submit]' ).mouseup( function(  ){
                canSubmit = true;
                setTimeout(function(){canSubmit = false;},32);
                cfg.submit();
            });
            form.find('button[type=submit],input[type=text]:visible,input[type=email]:visible,input[type=password]:visible' )
                .toArray()
                .forEach( function( el ){
                    DOM.addListener(el, 'keyup', function( e ){
                        if( e.which === 13 || e.which === 10 ){
                            cfg.submit();
                            e.preventDefault();
                            e.stopPropagation();
                        }
                    });
                });
            var elSubmit = form.find('button[type=submit]' ).click(function(){
                return false;
                if( document.activeElement === this )
                    cfg.submit();
            });
            var widgets = Z.widgets,
                root = cfg.renderTo;

            for( var i in widgets )
                if( widgets.hasOwnProperty( i ))
                    Array.prototype.slice.call(root.querySelectorAll( '.'+i )).forEach(function (el) {
                        widgets[i](el, map[el.id]);
                    } );
            return cfg;
        };
        out.dataGetter = {
            checkbox: function(el){
                return el.checked;
            },
            def: function(el){
                return el.value;
            }
        };
        return out;
    })(),
    graph: function( cfg ){
        cfg.renderTo.innerHTML = DOM.tplRenderer('graph')();

        var chart = new SmoothieChart({grid:{
                fillStyle:'#ffffff',strokeStyle:'rgba(119,119,119,0.39)',
                verticalSections:3}}),
            canvas = document.getElementById('smoothie-chart'),
            series = new TimeSeries();
        cfg.data.content.forEach( function( el ){
            series.append(el.date, el.val);
        })

        chart.addTimeSeries(series, {lineWidth:1.6,strokeStyle:'#2f318c'});
        chart.streamTo(canvas, 975);
    },
    stats: function( cfg ){
        cfg.renderTo.innerHTML = DOM.tplRenderer('stats')(cfg.data.content);
    },
    projectList: function( cfg ){
        var updateSub = function(  ){
            Z.subMenu(['Проекты'].concat(cfg.data.content.map( function( el ){
                return {icon: 'foilder',text: el.name, link: 'project/'+el.id};
            })));
        };
        var update = function(  ){

            cfg.renderTo.innerHTML = DOM.tplRenderer('projectList')(cfg.data.content);
            var checks = Z.toArray(cfg.renderTo.querySelectorAll('input[type=checkbox]'));
            checks.forEach( function(el, i){
                var invert = function(  ){
                    cfg.data.content[i].closed = !cfg.data.content[i].closed;
                    setTimeout(update,10);
                    setTimeout(updateSub,10);
                    Z.query({url: 'api/project/edit', data: {id:cfg.data.content[i].id, data: {closed: cfg.data.content[i].closed}}})
                };
                DOM.addListener(el,'click', invert);
                DOM.addListener(el,'keyup', invert);
            });
            var pencils = Z.toArray(cfg.renderTo.querySelectorAll('.js_edit_icon'));
            var lis = Z.toArray(cfg.renderTo.querySelectorAll('li'));
            pencils.forEach( function( el, i ){
                DOM.addListener(el, 'click', function( e ){
                    e.stopPropagation();
                    e.preventDefault();
                    var el = lis[i+1].querySelector('.js_project_name');
                    el.innerHTML = '<input type="text" class="form-control" style="width:30em;display:inline-block;border:0;padding:0" placeholder="Название проекта">';
                    var input = el.querySelector('input');

                    input.value = cfg.data.content[i].name;
                    var changed = function(  ){
                        cfg.data.content[i].name = input.value;
                        setTimeout(updateSub,10);
                    };
                    setTimeout(input.focus.bind(input),10);
                    DOM.addListener(input,'mouseup', changed);
                    DOM.addListener(input,'change', changed);
                    DOM.addListener(input,'keyup', changed);
                    var ok = function(  ){
                        setTimeout( function(  ){
                            Z.query({url: 'api/project/edit', data: {id:cfg.data.content[i].id, data: {name: cfg.data.content[i].name}}})
                            update();
                        }, 10);
                    };
                    DOM.addListener(input,'blur', ok);
                    DOM.addListener(input,'keydown', function( e ){
                        if( e.keyCode === 13 || e.keyCode === 27 ){
                            this.blur();
                            ok();
                        }
                    });
                });
            });

            var addNew = cfg.renderTo.querySelector('.js_add_project');
            DOM.addListener(addNew,'click', function( e ){
                e.preventDefault();
                e.stopPropagation();
                Z.query({url: 'api/project/create', data: {name:''}}, function( data ){
                    var id = data.data;
                    var num = cfg.data.content.length;
                    cfg.data.content.push({id: id, name: ''});
                    setTimeout( function(  ){
                        update();
                        updateSub();
                        $(cfg.renderTo ).find('.js_edit_icon:last' ).click();
                    },10)
                });


            });

        };
        update();
        updateSub();
    },
    contactList: function( cfg ){
        var updateSub = function(  ){
            Z.subMenu(['Проекты'].concat(cfg.data.content.map( function( el ){
                return {icon: 'foilder',text: el.name, link: 'project/'+el.id};
            })));
        };
        var update = function(  ){

            cfg.renderTo.innerHTML = DOM.tplRenderer('projectList')(cfg.data.content);
            var checks = Z.toArray(cfg.renderTo.querySelectorAll('input[type=checkbox]'));
            checks.forEach( function(el, i){
                var invert = function(  ){
                    cfg.data.content[i].closed = !cfg.data.content[i].closed;
                    setTimeout(update,10);
                    setTimeout(updateSub,10);
                    Z.query({url: 'api/project/edit', data: {id:cfg.data.content[i].id, data: {closed: cfg.data.content[i].closed}}})
                };
                DOM.addListener(el,'click', invert);
                DOM.addListener(el,'keyup', invert);
            });
            var pencils = Z.toArray(cfg.renderTo.querySelectorAll('.js_edit_icon'));
            var lis = Z.toArray(cfg.renderTo.querySelectorAll('li'));
            pencils.forEach( function( el, i ){
                DOM.addListener(el, 'click', function( e ){
                    e.stopPropagation();
                    e.preventDefault();
                    var el = lis[i+1].querySelector('.js_project_name');
                    el.innerHTML = '<input type="text" class="form-control" style="width:30em;display:inline-block;border:0;padding:0" placeholder="Название проекта">';
                    var input = el.querySelector('input');

                    input.value = cfg.data.content[i].name;
                    var changed = function(  ){
                        cfg.data.content[i].name = input.value;
                        setTimeout(updateSub,10);
                    };
                    setTimeout(input.focus.bind(input),10);
                    DOM.addListener(input,'mouseup', changed);
                    DOM.addListener(input,'change', changed);
                    DOM.addListener(input,'keyup', changed);
                    var ok = function(  ){
                        setTimeout( function(  ){
                            Z.query({url: 'api/project/edit', data: {id:cfg.data.content[i].id, data: {name: cfg.data.content[i].name}}})
                            update();
                        }, 10);
                    };
                    DOM.addListener(input,'blur', ok);
                    DOM.addListener(input,'keydown', function( e ){
                        if( e.keyCode === 13 || e.keyCode === 27 ){
                            this.blur();
                            ok();
                        }
                    });
                });
            });

            var addNew = cfg.renderTo.querySelector('.js_add_project');
            DOM.addListener(addNew,'click', function( e ){
                e.preventDefault();
                e.stopPropagation();
                Z.query({url: 'api/project/create', data: {name:''}}, function( data ){
                    var id = data.data;
                    var num = cfg.data.content.length;
                    cfg.data.content.push({id: id, name: ''});
                    setTimeout( function(  ){
                        update();
                        updateSub();
                        $(cfg.renderTo ).find('.js_edit_icon:last' ).click();
                    },10)
                });


            });

        };
        update();
        updateSub();
    }
};

var slice = Array.prototype.slice,
    toString = Object.prototype.toString,
    getType = function( obj ){
        return toString.call( obj );
    };
var Z = window.Z;

//console.log('js.util.Observable');
var slice = Array.prototype.slice;
var eventBuilder = function( el, scope ){
    var out = [scope],
        txt = [], names = [], counter = 0, fireFn;
    Z.each( el.list, function( el ){

        out.push( el.fn, el.caller );
        names.push( 'f'+ counter, 'c'+ counter );
        txt.push('f'+ counter +'.apply('+ 'c'+ counter + ', (data[dataLength] = c'+ counter+') && data) === false');
        counter++;
    });
    names.push('data');
    //out.push( out.length );//
    !el.plain && txt.reverse();
    fireFn = new Function(
        names.join(','),
        //'var args = slice.call(arguments,count);' +
        'var dataLength = data.length;return (' + txt.join('||')+')? false : this;'
    );
//        console.log(fireFn.toSource());
    el.fn = fireFn.bind.apply(fireFn, out);
};
var observable = {

    /*
     Function: fireEvent (fire)
     Fires an event



     Parameters:
     eventName - name of event
     args[ 1 .. inf ] - arguments to event callbacks

     */
    fireEvent : function fire( eventName ) {
        this.eventList = this.eventList || {};
        var data = slice.call( arguments, 1 ),
            event = this.eventList[ eventName ],
            allEvents = this.eventList[ '*' ],
            prevented;

        //eventName !== 'mousemove' && console.log(eventName, data, this._className, this.innerEl, this.el);
        allEvents && allEvents.fn(slice.call( arguments ));

        if( event )
            return event.fn( data );
        else{
            prevented = false;
            if( this.listeners && this.listeners[ eventName ] ){
                event = [ { fn: this.listeners[ eventName ], caller: this } ];
                var i, subscriber, dataLength = data.length;

                /*debug cut*/
                /*if( event.length > 10 ){
                 console.warn('Strange event `'+ eventName +'`, ' + event.length + ' handlers attached')
                 }*//*/debug cut*/
                for( i = event.length; i ; ){
                    subscriber = event[ --i ];
                    data[ dataLength ] = subscriber.caller;
                    prevented = prevented || subscriber.fn.apply( subscriber.caller || subscriber, data ) === false;
                }

            }
        }

        return prevented ? false : this;
    },

    /* releasing the beast. generic fire that have got scope */
    _fireDeepEvent: function( scope, eventName, data ){
        var fns,
            prevented = false, i;

        if( this.listeners && ( fns = this.listeners[ eventName ] ) )
            if( typeof fns === 'function' )
                prevented = fns.apply( scope, data ) === false;
            else{
                for( i = fns.length; i ; ){
                    prevented = prevented || fns[ --i ].apply( scope, data ) === false;
                }
            }

        return prevented ? false : (this._base ? this._base._fireDeepEvent( scope, eventName, data ) : this );
    },

    /*
     Function: on

     Subscribe callback on event

     Parameters:
     eventName - name of event
     fn - callback function
     [ caller = this ] - scope to call on ( default: this )

     */
    on : function on( eventName, fn, caller ) {
        if( typeof eventName !== 'string' ){ // object of events
            for( var i in eventName ){
                if( eventName.hasOwnProperty( i ) )
                    this.on( i, eventName[ i ] );
            }
        }else{
            if( eventName.indexOf(',') > -1 ){
                Z.each( eventName.split(','), function( eventName ){
                    this.on( eventName.trim(), fn, caller );
                }.bind(this) );
            }else{
                var eventList = this.eventList = this.eventList || {},
                    data = {fn : fn, caller : caller || this };

                !eventList && (eventList = {});
                (eventList[eventName] || ( eventList[eventName] = { list: [] } )).list.push( data );
                eventList[eventName] = { list: eventList[eventName].list.slice() };
                if( eventList[eventName].list.length > 10 ){
                    window.console.warn('Strange event `'+ eventName +'`, ' + eventList[ eventName ].length + ' handlers attached');
                }/*/debug cut*/
                eventBuilder( eventList[eventName], this );
            }
        }
        return this;
    },
    once: function( name, fn, scope ){
        var wrap = function(){
            fn.apply(scope, Z.toArray(arguments));
            this.un(name, wrap);
        };
        this.on( name, wrap, this );
    },
    /*
     Function: un

     Unsubscribe callback for event. It's important that fn shoul be same function pointer, that was pased in <on>

     Parameters:
     eventName - name of event
     fn - callback function

     */
    un : function un( eventName, fn ){
        if( !this.eventList )
            return;
        var event = this.eventList[ eventName ],
            i, eventList;



        if( event !== undefined )
            if( fn === undefined )
                delete this.eventList[ eventName ];
            else{
                for( eventList = event.list, i = eventList.length ; i ; )
                    if( eventList[ --i ].fn === fn )
                        eventList.splice( i, 1 );

                if( !eventList.length )
                    delete this.eventList[ eventName ];
                else
                    eventBuilder( event, this );
            }


        return this;
    },
    /*
     Function: set

     Set parameter with events
     */

    set: function( param, value ){
        var oldValue = this[ param ];
        if( oldValue === value )
            return false;

        if( this.fireEvent( param + 'BeforeSet', value, oldValue ) === false )
            return false;
        this[ param ] = value;
        this.fireEvent( param + 'Set', value, oldValue );
        this.fire( '_changed', param, value, oldValue );
        return this;
    }


};
observable.fire = observable.fireEvent;
Z = {
    unique: function( arr ){
        var i, c, hash = {}, out = [];
        for( i = 0, c = arr.length; i < c; i++ )
            hash[ arr[ i ] ] = true;

        c = 0;

        for( i in hash )
            ( hash.hasOwnProperty( i ) ) && ( out[ c++ ] = i );

        return out;
    },
    intersect: function( a, b ){
        var hash = {},
            out = [],
            i, _i;
        for( i = 0, _i = a.length; i < _i; i++ ){
            hash[ a[ i ] ] = true;
        }
        for( i = 0, _i = b.length; i < _i; i++ ){
            if( hash[ b[ i ] ] !== undefined )
                out.push( b[ i ] );
        }
        return out;
    },
    union: function( a, b ){
        var hash = {},
            out = a.slice(),
            i, _i;
        for( i = 0, _i = a.length; i < _i; i++ ){
            hash[ a[ i ] ] = true;
        }
        for( i = 0, _i = b.length; i < _i; i++ ){
            if( hash[ b[ i ] ] === undefined )
                out.push( b[ i ] );
        }
        return out;
    },
    diff: function( b, a ){
        var hash = {},
            out = [],
            i, _i;
        for( i = 0, _i = a.length; i < _i; i++ ){
            hash[ a[ i ] ] = true;
        }
        for( i = 0, _i = b.length; i < _i; i++ ){
            if( hash[ b[ i ] ] === undefined )
                out.push( b[ i ] );
        }
        return out;
    },
    doAfter: function(){
        var i = 0,
            _i = arguments.length - 1,
            counter = _i,
            callback = arguments[ _i ],
            data = {};

        for( ; i < _i; i++ ){
            (function( callFn, i ){
                var fn = function(){
                    data[ i ] = arguments;

                    if( fn.store != null )
                        data[ fn.store ] = arguments;

                    if( !--counter )
                        callback( data );

                };

                callFn( fn )
            })( arguments[i], i );
        }
    },
    toArray: function( obj ){
        return slice.call( obj );
    },
    isArray: function( obj ){
        return getType( obj ) === '[object Array]';
    },
    map: function(el, f){
        var out = [],
            toArray = Z.toArray;
        this.each(el, function(){
            out.push( f.apply( this, toArray(arguments) ) );
        });
        return out;
    },
    makeArray: function( obj ){
        return obj !== void 0 ? ( this.isArray( obj ) ? obj : [ obj ] ) : [];
    },
    getProperty: function( prop ){
        return function(a){
            return a[ prop ];
        }
    },
    apply: function( el1, el2 ){
        var i;

        for( i in el2 )
            el1[ i ] = el2[ i ];

        return el1;
    },
    each: function( obj, f ){
        var i, _i;
        if( obj === null || obj === void 0 || obj === false || obj === true )return;
        if( toString.call( obj ) === '[object Array]' ){
            for( i = 0, _i = obj.length; i < _i; i++ )
                f( obj[i], i );
        }else{
            for( i in obj )
                if( obj.hasOwnProperty( i ) )
                    f( i, obj[i] );
        }
    },
    observable: function( obj ){
        Z.apply(obj, observable);
    },
    makeHash: function( arr, hash, hashVal ){
        var out = {}, i, item;
        if( typeof hashVal === 'function' )
            if( typeof hash === 'function' ){
                for( i = arr.length; i; ){
                    item = arr[ --i ];
                    out[ hash( item ) ] = hashVal(item);
                }
            }else{
                for( i = arr.length; i; ){
                    item = arr[ --i ];
                    out[ item[ hash ] ] = hashVal(item, out[ item[ hash ] ]);
                }
            }
        else
        if( typeof hash === 'function' ){
            for( i = arr.length; i; ){
                item = arr[ --i ];
                out[ hash( item ) ] = item;
            }
        }else{
            for( i = arr.length; i; ){
                item = arr[ --i ];
                out[ item[ hash ] ] = item;
            }
        }
        return out;
    },
    pluralForm: (function (f) {
                f = new Function('n', 'var r = ' + f + ';return typeof r !== \'boolean\' ? r : r === true ? 1 : 0;');
                return function (text) {
                    text = text.split(',');
                    return text.splice(1)[f(text[0])];
                };
            })('(n%10==1 && n%100!=11 ? 0 : n%10>=2 && n%10<=4 && (n%100<10 || n%100>=20) ? 1 : 2);'),
    clone: function( obj, deep ){
        var out, i, cloneDeep = deep != null;
        switch( getType( obj ) ){
            case '[object Array]':
                out = [];
                if( cloneDeep )
                    for( i = obj.length; i; ){
                        --i;
                        out[ i ] = Z.clone( obj[ i ], true );
                    }
                else
                    for( i = obj.length; i; ){
                        --i;
                        out[ i ] = obj[ i ];
                    }
                return out;
            case '[object Object]':
                out = {};
                if( cloneDeep )
                    for( i in obj )
                        out[ i ] = Z.clone( obj[ i ], true );
                else
                    for( i in obj )
                        out[ i ] = obj[ i ];


                return out;
        }
        return obj;
    }
};
Z.translit = (function(  ){
    var translitTable = {
        'а': 'a',
        'б': 'b',
        'в': 'v',
        'г': 'g',
        'д': 'd',
        'е': 'e',
        'ё': 'jo',
        'ж': 'zh',
        'з': 'z',
        'и': 'i',
        'й': 'j',
        'к': 'k',
        'л': 'l',
        'м': 'm',
        'н': 'n',
        'о': 'o',
        'п': 'p',
        'р': 'r',
        'с': 's',
        'т': 't',
        'у': 'u',
        'ф': 'f',
        'х': 'h',
        'ц': 'c',
        'ч': 'ch',
        'ш': 'sh',
        'щ': 'sch',
        'ъ': '',
        'ы': 'y',
        'ь': '',
        'э': 'e',
        'ю': 'ju',
        'я': 'ja',
        ' ': '_',
        'і': 'i',
        'ї': 'i'
    };
    return function( text ){
        return text.replace(/[а-я ії]/gi,function( char ){
            return char.toLowerCase() === char ?
                translitTable[char] :
                translitTable[char.toLowerCase()].toUpperCase();
        });
    };
})();
Z.promise = function promise(){
    this.list = [];
};

Z.promise.prototype = {
    after: function( fn, scope ){
        this.list.push(fn, scope);
        if( this.wasDone )
            this.done();
        return this;
    },
    done: function(){
        this.wasDone = true;
        var scope = this.scope, args = this.args;
        this.list.forEach( function( el ){
            el && el.apply(scope, args);
        });
        this.list = [];
    }
};
var storage = function( data ){
    this.data = data;
};
storage.prototype = {
    addHash: function( names ){
        names = Z.makeArray(names);
        this.hashes = names;
        this.hash = this.hash || {};
        var data = this.data;
        names.forEach( function( hashName ){
            var hash = this.hash[hashName] = {};
            for( var i = 0, _i = data.length; i < _i; i++ ){
                var item = data[i],
                    val = ((item[hashName]||'')+'').toLowerCase();
                (hash[val] = hash[val] || []).push(item);
            }
        }.bind(this))
    },
    get: function( hash, key ){
        return this.hash[hash][(key+'').toLowerCase()] || [];
    },
    remove: function( hash, key ){
        var data = this.get(hash, key), item, j;
        for( j = data.length; j; ){
            item = data[--j];
            var names = this.hashes;
            var hash = this.hash = this.hash || {};
            names.forEach( function( hashName ){
                var hashObj = hash[hashName] = hash[hashName] || {};
                var val = ((item[hashName]||'')+'').toLowerCase();
                var items = hashObj[val];
                if( !items )
                    throw "DO NOT MODIFY ITEMS OUTSIDE";
                for( var i = 0, _i = items.length; i < _i; i++ ){
                    var obj = items[i];
                    if( obj === item ){
                        items.splice(i,1);
                        break;
                    }
                }
                if( !items.length )
                    delete hashObj[val];
            } );
        }
        
        var store = this.data;
        for( var i = store.length; i; ){
            var item = store[--i];
            if( item[hash] === key )
                store.splice(i,1);
        }

    },
    add: function( obj ){
        this.data.push(obj);
        this._addToHash( obj );

    },
    _addToHash: function( obj ){
        var names = this.hashes;
        this.hash = this.hash || {};
        names.forEach( function( hashName ){
            var hash = this.hash[hashName] = this.hash[hashName] || {};
            var val = ((obj[hashName]||'')+'').toLowerCase();
            (hash[val] = hash[val] || []).push(obj);
        }.bind(this))
    },
    edit: function( item, data ){
        var names = this.hashes;
        var hash = this.hash = this.hash || {};
        names.forEach( function( hashName ){
            var hashObj = hash[hashName] = hash[hashName] || {};
            var val = ((item[hashName] || '')+'').toLowerCase();
            var items = hashObj[val];
            if( !items )
                throw "DO NOT MODIFY ITEMS OUTSIDE";
            for( var i = 0, _i = items.length; i < _i; i++ ){
                var obj = items[i];
                if( obj === item ){
                    items.splice(i,1);
                    break;
                }
            }
            if( !items.length )
                delete hashObj[val];
        } );
        Z.apply( item, data );
        this._addToHash( item );

    }
};
Z.observable(storage.prototype);
Z.UUID = {
    getRandom: (function(){
        var hexDigit = '0123456789abcdefABCDEF'.split( '' ),
            rad = hexDigit.length;
        return function(){
            var uid = '', i;

            for( i = 0; i < 8; i++ ) uid += hexDigit[ Math.floor( Math.random() * rad ) ];
            uid += '-';

            for( i = 9; i < 13; i++ ) uid += hexDigit[ Math.floor( Math.random() * rad ) ];
            uid += '-4';

            for( i = 15; i < 18; i++ ) uid += hexDigit[ Math.floor( Math.random() * rad ) ];
            uid += '-';
            uid += hexDigit[ ( Math.floor( Math.random() * rad ) & 0x3 ) | 0x8 ];

            for( i = 20; i < 23; i++ ) uid += hexDigit[ Math.floor( Math.random() * rad ) ];
            uid += '-';

            for( i = 24; i < 36; i++ ) uid += hexDigit[ Math.floor( Math.random() * rad ) ];

            return uid;
        };
    })()
};
Z.validate = {
    email: function( text ){
        return ((text||'')+'').match(/[^\s@]+@[^\s@]+\.[^\s@]+/) !== null;
    },
    phone: function( text ){
        text = ((text||'')+'');
        if(text.match(/^[0-9\+\(\)\-\s]*$/) !== null ){ // phone
            var phone = text.replace(/[\+\(\)\-\s]*/g,'');
            /*if( phone.charAt(0) === '8')
                phone = '7'+phone.substr(1);
            if( phone.charAt(0) !== '7')
                phone = '7'+ phone;
            if( phone.length === 11 )
                return true;*/
            if(phone.length>7 && phone.length<16)
                return true;
        }
        return false;
    }
};
var eights = {
    8:{0:true,6:true},
    5:{5:true,2:true,0:true,6:true,3:true},
    6:true,
    1:true,
    2:true,
    4:true
}

Z.sanitize = {
    phone: function( text ){
        var phone = text.replace(/[\+\(\)\-\s]*/g,'');
        if( phone.charAt(0) === '8'){
            var c2 = phone.charAt(1);
            if(!( eights[c2] === true || (eights[c2] && eights[c2][phone.charAt(2)]===true) ) ){
                    phone = '7'+phone.substr(1);
            }
        }
        return {raw: phone, view: '+'+ phone.substr(0,1)+'('+phone.substr(1,3)+')'+phone.substr(4,3)+'-'+phone.substr(7,2)+'-'+phone.substr(9)};
    }
};

Z.storage = {
    proto: storage,
    load: function( name, callback ){
        var storeItem = Z.storage[name];
        if( !storeItem ){
            Z.storage[name] = (new Z.promise()).after(callback);
            Z.storage.loader[name](name);
            return Z.storage[name];
        }else if(storeItem instanceof Z.promise ){
            callback && storeItem.after(callback);
        }else{
            callback && callback( Z.storage[name] );
        }
        return Z.storage[name];
    },
    loader: {
        companies: function( name ){
            Z.query( 'company', 'list', void 0, function(data){
                var promise = Z.storage[name];
                Z.storage[name] = new storage(data.data);
                Z.storage[name].addHash(['id','name']);
                promise.args = [Z.storage[name]];
                promise.done();
            });
        },
        projects: function( name ){
            Z.query( 'project', 'list', void 0, function(data){
                var promise = Z.storage[name];
                var getVal = function( k, v ){
                    return v;
                };
                data.data.forEach( function( el ){
                    if( el.request )
                        el.request = Z.map(el.request, getVal);
                });
                Z.storage[name] = new storage(data.data);
                Z.storage[name].addHash(['id','name']);
                promise.args = [Z.storage[name]];
                promise.done();
            });
        },
        contacts: function( name ){
            Z.storage.load('contactLists', function( store ){
                var promise = Z.storage[name];
                var data = [],
                    wait = 0,
                    finish = function(  ){
                        Z.storage[name] = new storage(data);
                        Z.storage[name].addHash(['phone','name', '_list', 'id']);
                        promise.done();
                    };

                store.data.forEach( function( list ){
                    if( list.length ){
                        wait++;
                        Z.query('contactList', 'get', {id: list.id}, function( contacts ){
                            data = data.concat(contacts.data);
                            contacts.data.forEach( function( contact ){
                                contact._list = list.id;
                            });
                            wait--;
                            !wait && finish();
                        });
                    }
                });
                !wait && finish();

            });
        },
        contactLists: function( name ){

            Z.query( 'contactList', 'list', void 0, function(data){
                var promise = Z.storage[name];
                Z.storage[name] = new storage(data.data);
                Z.storage[name].addHash(['id','name']);
                promise.args = [Z.storage[name]];
                promise.done();
                Z.storage.load('contacts');
            });
        }
    }
};
Z.observable( Z.storage );
Z.iframeAnswer = function( data ){
    Z.iframeAnswer.fire(data.id, data.data);
};
Z.observable( Z.iframeAnswer );
Z.cookie = {
    singleton:true,
    /*
     Function: get
     get cookie by name

     Parameters:
     name - cookie name

     Return:
     (string) value of cookie
     */
    get: function ( name ){
        var matches = document.cookie.match(
            new RegExp( "(?:^|; )" +
                name.replace( /([\.$?*|{}\(\)\[\]\\\/\+^])/g, '\\$1' ) +
                "=([^;]*)" )
        );
        return matches ? decodeURIComponent( matches[1] ) : undefined;
    },
    /*
     Function: set
     set cookie value

     Parameters:
     name - cookie name
     value - value
     props - <cookieProperties>
     Return:
     undefined
     */
    set: function ( name, value, props ){
        props = props || {};
        var exp = props.expires;
        if( typeof exp == "number" && exp ){
            var d = new Date();
            d.setTime( d.getTime() + exp * 1000 );
            exp = props.expires = d;
        }
        if( exp && exp.toUTCString ){ props.expires = exp.toUTCString() }

        value = encodeURIComponent( value );
        var updatedCookie = name + "=" + value;
        for( var propName in props ){
            updatedCookie += "; " + propName;
            var propValue = props[propName];
            if( propValue !== true ){ updatedCookie += "=" + propValue }
        }
        document.cookie = updatedCookie

    },
    remove: function ( name ){
        this.set( name, null, { expires:-1, path: '/' } );
    }
};

Z.widgets = {
    'b-profile__logout': function( el ){
        DOM.addListener(el,'click', function(  ){
            Z.stateMachine('logout', void 0, Z.run );
        });
    }
};
Z.controller = {};
Z.loadTpls = function( arr, fn ){
    arr = Z.makeArray(arr);
    var loaded = Z.loadTpls.loaded, notLoadedList = [];
    if(!loaded)
        loaded = Z.loadTpls.loaded = {};
    arr.forEach( function( name ){
        if(!loaded[name])
            notLoadedList.push( name );
    });
    if( notLoadedList.length )
        Z.query('web','getTpls', {name: notLoadedList}, function( data ){
            try{
                eval(data.data);
            }catch(e){};
            notLoadedList.forEach( function( name ){
                loaded[name] = true;
            });
            fn();
        });
    else
        fn();
};
Z.findItems = function( el, arr ){
    var hash = {};
    arr.forEach( function( cls ){
        hash[cls] = el.querySelector('.'+cls);
    });
    return hash;
};
var f = function(){

    var listRenderer, commentRenderer, newCommentRenderer;
    var widgets = Z.widgets;
    window.initialize = function( root ){
        for( var i in widgets )
            if( widgets.hasOwnProperty( i ))
                Array.prototype.slice.call(root.querySelectorAll( '.'+i )).forEach( widgets[i] );
    };
    window.initialize( document );
    DOM.inited = true;
    DOM._ready();
    DOM.addListener(document, 'keyup', function( e ){
        if( e.keyCode === 32 || e.keyCode === 13 ){
            if( e.target.tagName === 'INPUT' && e.target.getAttribute('type') === 'checkbox'){
                e.target.checked = !e.target.checked;
                e.preventDefault();

            }
        }
    });
    var IO = window.IO = {};
    Z.observable(IO);
    if( window.io ){
    var socket = io.connect( document.location.origin );
    /*socket.on( 'joined', function( data ){
    //    socket.emit( 'giveLog' );
    } );*/
    /*socket.on( 'msg', function( data ){
        console.warn( data );
    } );*/
    socket.on( 'delivery', function( data ){
        IO.fire('delivery', data);
        //console.log( data );
    } );
    }
};

function r(f){/in/.test(document.readyState)?setTimeout(r.bind(null,f),90):f()}
r(f);
