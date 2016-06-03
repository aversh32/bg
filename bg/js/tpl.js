/*
 Class:   js.util.LogicTemplate

 Parse templates with logic [singleton].
 */
(function(undefined){
    "use strict";
    var fs = require('fs');
    var Path = require('path');
    var rtrim = /^(\s|\u00A0)+|(\s|\u00A0)+$/g,
        LogicTplUnit,
        LogicTemplate = function( ){

            this.bracesLen = [
                this.options.braces[0].length,
                this.options.braces[1].length
            ];

        };
    var prefixJoin = function (a, b) {
        if(!a)
            return b;
        return a+'_'+b;
    };
    LogicTemplate.prototype = {
        singleton: true,
        ctor: function( ){

            this.bracesLen = [
                this.options.braces[0].length,
                this.options.braces[1].length
            ];
            this.tplList = {};
            this.renderers = {};
            this.tplGroup = {};
        },
        theEscapeRegExp: new RegExp(/([\{\}])/g),
        escapedCache: { '{{0}}':'\\{\\{0\\}\\}' },
        escapeRegExp: function( text ){
            var cache = this.escapedCache;
            if( cache[ text ] == null )
                cache[ text ] = text.replace( this.theEscapeRegExp, '\\$1' );
            return cache[ text ];
        },
        /*
         Object: options
         parser config

         */
        options: {
            braces: [
                '{{',
                '}}'
            ],
            replaceArray: {
                'and': '&&',
                'or': '||',
                'not': '!'
            },
            'checkVars': true,
            'cache': true
        },
        bracesLen: [],
        tpls: {},
        cached: function( hash ){//check if item is already cached
            return false;
        },

        /*
         Function: parse
         parse template string. Wraps <parser>

         Parameters:
         text - template string

         Return:
         <parsedTree>
         */
        parse: function( text, identity ){

            if( identity === undefined ){
                identity = Math.random();//md5( text );
            }
            this.lastTpl = identity;
            if( this.options[ 'cache' ] ){
                if( this.cached( identity ) ){
                    this.tpls[ identity ] = this.loadCache( identity );
                    return this;
                }
            }
            this.tpls[ identity ] = this.parser( text );
            return this;
        },

        /*
         function: findTemplate

         Parameters:
         text - incoming string

         Return:
         logic template item (string)
         */
        findTemplate: function( text ){
            var braces = this.options[ 'braces' ],
                braceLen = this.bracesLen,
                braceCnt = 0,
                loopCnt = 0,
                fBrace = 0,
                lBrace = 0,
                min = 0,
                isFirst = false,
                template = '',
                mmin = Math.min,
                mmax = Math.max;
            do{
                loopCnt++;
                if( loopCnt > 10 ){
                    return 'recursion';
                }
                fBrace = text.indexOf( braces[ 0 ] );
                lBrace = text.indexOf( braces[ 1 ] );

                min = mmin( fBrace, lBrace );
                if( fBrace === -1 || lBrace === -1 ){
                    min = mmax( fBrace, lBrace );
                }

                isFirst = min == fBrace && fBrace !== -1;
                if( !( fBrace === -1 && lBrace === -1 ) ){

                    template += text.substr( 0, min + braceLen[ isFirst ? 0 : 1 ] );
                    text = text.substr( min + braceLen[ isFirst ? 0 : 1 ] );
                }

                braceCnt += isFirst ? 1 : -1;
            } while( braceCnt > 0 );
            return template;


        },

        /*
         function: parser

         Parameters:
         text - incoming string

         Return:
         <parsedTree>
         */
        parser: function( text ){

            var stack = [],
                braces = this.options[ 'braces' ],
                braceLen = this.bracesLen,
                fBrace = 0,
                tmpText = '',
                template = 0,
                tokenize = 0;

            while( text.length ){
                fBrace = text.indexOf( braces[ 0 ] );
                if( fBrace === -1 ){
                    if( text !== '' ){
                        stack.push( [ 0, text ] );
                    }
                    text = '';
                } else{
                    tmpText = text.substr( 0, fBrace );
                    if( tmpText !== '' ){
                        stack.push( [ 0, tmpText ] );
                    }
                    text = text.substr( fBrace );

                    template = this.findTemplate( text );
                    text = text.substr( template.length );
                    template = template.substr( braceLen[ 0 ], template.length - braceLen[ 1 ] - braceLen[ 0 ] );
                    //here we do recursion
                    tokenize = this.tokenize( template );
                    stack.push( [ 1, tokenize ] );

                    //here we have got a syntax unit

                }
            }
            return stack;
        },

        /*
         function: tokenize
         split logic template to tokens

         Parameters:
         text - incoming string
         lastTID [optional] - (default: _0_)

         Return:
         <parsedTree>
         */
        tokenize: function( text, lastTID ){

            if( lastTID === undefined )
                lastTID = 0;

            var firstChar = true,
                brackets = 0,
                startWord = 0,
                word = false,
                functionCheck = false,
                isQuote = false,
                isSingleQuote = false,
                screenQuote = false,
                secondVarStage = false,
                guess = '',
                braces = this.options[ 'braces' ],
                braceLen = this.bracesLen, //to init
            //bracesLen = this.bracesLen, //to init
                brace1 = [],
                buffer = [ false, false, false ], //this would be a buffer, that contains three last symbols
                bracePos = 0,
                i,
                j,
                mL = '',
                varArray = [],
                nameLen = 0,
                valLen = 0,
                singleCache = false,
                isEmpty = false,
                bracketsStart = false,
                jExtend = Z.apply,
                tmp,
                el;

            text = this.trim( text );

            for( i = 0, j = braceLen[ 0 ] + 1; i < j; i++ ){
                brace1[ i ] = braces[ 0 ].charAt( i );
            }


            //it looks like fucking shitty bullshit, I know, but it usually have (O) difficulty that depends only on string length

            for( i = 0, j = text.length + 1; i < j; i++ ){

                mL = text.charAt( i ).toLowerCase();

                if( !screenQuote && ( ( singleCache = mL == '\'' ) || mL == '"' ) ){ //QUOTING
                    if( !isQuote ){ //if not screening
                        isSingleQuote = singleCache;
                    }
                    if( isSingleQuote == singleCache || !isQuote ){
                        isQuote = !isQuote;
                    }
                    if( !word ){
                        startWord = i + 1;
                    }
                } else if( !isQuote ){ //END QUOTING / MINE CODE
                    isEmpty = this.trim( mL ) === ''; //TODO: test speed of === '' vs str_len == 0
                    //make it complicated
                    if( !isEmpty ){
                        buffer.shift();
                        buffer.push( mL );

                        if( ( buffer[ 0 ] !== '=' && buffer[ 0 ] !== '<' && buffer[ 0 ] !== '>' && buffer[ 0 ] !== '!' ) &&
                            buffer[ 1 ] === '=' && buffer[ 2 ] !== '=' ){ //check single equal
                            //TODO: test === vs == in text compare

                            var bufferPos = text.substr( 0, i ).lastIndexOf( '=' );

                            text = text.substr( 0, bufferPos ) + '=' + text.substr( bufferPos );

                            i++;
                            j++;
                            startWord++;
                        }
                    }

                    if( mL >= 'a' && mL <= 'z' || mL == '.' || mL == '_' || mL == '[' || mL == ']' || mL === '$' ||
                        ( secondVarStage && ( mL >= '0' && mL <= '9' ) )
                        ){
                        secondVarStage = true;
                        if( mL == '[' ){
                            bracketsStart = i;
                            brackets++;
                        } else if( mL == ']' ){
                            brackets--;
                            if( brackets == 0 ){
                                var inBrackets = ( text.substr( bracketsStart + 1, i - bracketsStart - 1 ) );
                                //var tmpTokenize =
                                //lastTID += tmpTokenize.lastTID;
                                var subTokenize = this.tokenize( inBrackets, lastTID );//tmpTokenize.tokenize;

                                var subTextOldLen = i - bracketsStart - 1;
                                var subTextLen = subTokenize[ 't' ].length;
                                text = text.substr( 0, bracketsStart + 1 ) + subTokenize[ 't' ] + text.substr( i );
                                i -= (tmp = subTextOldLen - subTextLen );
                                j -= tmp;
                                varArray = varArray.concat( subTokenize[ 'v' ] );
                                //varArray = jExtend( varArray, subTokenize[ 'v' ] );
                                lastTID += subTokenize[ 'v' ].length;
                            }
                        }

                        word = true;
                    } else{
                        secondVarStage = false;

                        if( brackets == 0 ){


                            if( word ){

                                var varText = text.substr( startWord, i - startWord );
                                var varTextL = varText.toLowerCase();
                                valLen = i - startWord;
                                if( this.options[ 'replaceArray' ][ varTextL ] !== undefined ){
                                    text = text.substr( 0, startWord ) + this.options[ 'replaceArray' ][ varTextL ] + text.substr( i );
                                    nameLen = this.options[ 'replaceArray' ][ varTextL ].length;
                                    functionCheck = false;
                                } else{
                                    el = {
                                        'n' : braces[ 0 ] + lastTID + braces[ 1 ],
                                        'v' : varText,
                                        'f' : false//, // function predict
                                        //'s' : false // subtemplate
                                    };
                                    varArray.push( el );
                                    nameLen = el[ 'n' ].length;

                                    text = text.substr( 0, startWord ) + el[ 'n' ] + text.substr( i );

                                    lastTID++;
                                    functionCheck = true;

                                }
                                j -= (tmp = valLen - nameLen); //don't know why
                                i -= tmp; //+1, but it works
                                guess += mL;

                            }
                            if( !isEmpty && functionCheck ){
                                functionCheck = false;
                                if( mL == '(' ){
                                    varArray[  varArray.length  - 1 ][ 'f' ] = true;
                                }
                            }
                            startWord = i + 1;
                            word = false;

                        }
                    }
                }
                screenQuote = mL == '\\';
                firstChar = false;

            }
            /*
             if( guess.substr( 0, 1 ) == '~' ){ //it's for back compatibility with my old template system
             text = this.trim( text.substr( 1 ) );
             text = this.replace( varArray[ 0 ][ 'n' ], varArray[ 0 ][ 'n' ] + '(', text ) + ')';
             varArray[ 0 ][ 'f' ] = true;
             }
             now I would do some voodoo, because I want to make compatibility with old version,
             * where compare with empty text line looked like:
             * {{c=?'default':'{{c}}'}}
             *
             * also I would make single equal works (I think that not programmers and basic lovers would prefer it use).
             */
            //oh no, I choose to make upper code more complicated
            //end of magic
            //_d(text);
            return { 't' : text, 'v' : varArray, 'g' : guess }; //guess isn't useful now, but maybe later
        },

        /*
         function: generateJS
         generate native JS from <parsedTree>

         Parameters:
         identity [optional]- cache identity of template. Now not used, instead of this it just take last parsed

         Return:
         js code
         */
        generateJS: function ( identity ){
            if( identity === undefined ){
                identity = this.lastTpl;
            }//_d(this);
            var blocks = this.tpls[ identity ],
                output = '',
                firstLine = true,
                lastOperand = [],
                exitArray = {
                    'end':false,
                    'endif':false,
                    'exitif':false,
                    'fi':false,
                    'next':false,
                    '/':false,
                    'endforeach':false,
                    'exitforeach':false
                },
                config = this.options,
                prefix = '',
                postfix = '',
                a, b, o1, o2, asPos, noAs, cycleVarName;
            //_d( blocks );
            for( a = 0,b = blocks.length; a < b; a++ ){
                var stepUsed = false;
                if( blocks[ a ][ 0 ] == 0 ){
                    output += 'r+=\'' + this.addSlashes( blocks[ a ][ 1 ], '\'\\' ) + '\';';
                } else{
                    var logic = blocks[ a ][ 1 ][ 'v' ];
                    var text = blocks[ a ][ 1 ][ 't' ];
                    prefix = '';
                    postfix = '';
                    o1 = logic[ 0 ][ 'v' ].toLowerCase();
                    if( o1 == 'else' ){
                        stepUsed = true;

                        text = this.trim( text.replace( logic[ 0 ][ 'n' ], '' ) );
                        if( lastOperand[lastOperand.length - 1] == 'foreach' ){
                            lastOperand[lastOperand.length - 1] = 'else foreach';
                            o1 = 'end';
                            postfix += '}else{';
                        } else if( text === '' ){
                            output += '}else{';
                        } else{
                            prefix += '}else ';
                            postfix = '{';
                            //array_shift( logic ); //EDITED TODO
                            lastOperand.pop();
                            logic.shift();
                            o1 = logic[ 0 ][ 'v' ].toLowerCase();
                        }
                    }
                    if( o1 == 'foreach' ){
                        stepUsed = true;

                        text = this.trim( text.replace( logic[ 0 ][ 'n' ], '' ) ); //remove foreach
                        if( ( asPos = text.toLowerCase().indexOf( 'as' ) ) === false ){
                            cycleVarName = text;
                            noAs = true;
                        } else{
                            cycleVarName = text.substr( 0, asPos );
                            noAs = false;
                        }


                        if( text == '/' ){
                            o1 = 'end';
                        } else{
                            if( text === '' ){
                                text = '{{0}}';//default value. It automatically go deeper through dimensions
                                logic[ 0 ][ 'v' ] = '__el.value';
                            }
                            cycleVarName = this.buildLine( text, logic, false, false );

                            lastOperand.push( 'foreach' );

                            text = 'p[\'__a\']=0;' +
                                'if(' + cycleVarName + '!==void 0)' +
                                'p[\'__a\']=l(' + cycleVarName + ');' +
                                'if(p[\'__a\']>0){' +
                                'p[\'__c\']=0;'+
                                'p[\'__o\']=o(' + cycleVarName + ');' +
                                'for(var c in p[\'__o\'])if(p[\'__o\'].hasOwnProperty(c)){' +
                                'var v=p[\'__o\'][c];' +
                                'p[\'__c\']++;' +
                                'i.unshift(o(v));p=i[0];p1=i[1];' +
                                'p[\'__el\']={' +
                                '\'first\':p1[\'__c\']==1,' +
                                '\'last\':p1[\'__c\']==p1[\'__a\'],' +
                                '\'current\':p1[\'__c\'],' +
                                '\'count\':p1[\'__a\'],\'length\':p1[\'__a\'],' +
                                '\'key\':c,' +
                                '\'value\':v' +
                                '};';
                            output += ( text );



                        }

                    }
                    if( o1 == 'if' ){
                        stepUsed = true;

                        text = this.trim( text.replace( logic[ 0 ][ 'n' ], '' ) );
                        text = this.buildLine( text, logic, false );
                        if( text == '/' ){
                            o1 = 'end';
                        } else{
                            prefix += 'if';
                            postfix = '{';
                            lastOperand.push( 'if' );
                            if( !logic[ 0 ][ 'f' ] ){
                                text = '(' + text + ')';
                            }
                            text = prefix + text + postfix;
                            output += ( text );
                        }
                    }
                    if( o1 in exitArray ){ //ends
                        stepUsed = true;
                        //    _dcode(output,true);
                        var exiting = lastOperand[ lastOperand.length - 1 ];
                        if( exiting == 'foreach' || exiting == 'else foreach' ){
                            output += 'delete p.__el;delete p.__a;delete p.__c;delete p.__o;i.shift();p=i[0];p1=i[1];' + (postfix === '' ? '}' : '');
                            if( exiting == 'else foreach' ){
                                lastOperand[ lastOperand.length - 1 ] = 'if';
                            }
                        }
                        output += '}' + postfix;
                        if( logic[0]['v'] != 'else' )
                            lastOperand.pop();
                    }

                    if( !stepUsed ){
                        text = this.buildLine( text, logic, false );
                        output += 'r+=' + text + ';';
                    }

                }
                firstLine = false;
            }
            output = output.split( '\r' ).join( '' ).split( '\n' ).join( '\\n' );

            return this.replace( ['.\'\'','\'\'.'], ['',''], output );
        },

        /*
         function: replace
         templater was written on PHP, so this function is port from it. It do one replacement of each search

         Parameters:
         search - array of substring to search
         replace - array of substring to replace ( replaces have equal indexes to search array)
         subject - string

         Return:
         replaced string
         */
        replace: function( search, replace, subject ){//php like function
            search = this.toArray( search );
            replace = this.toArray( replace );
            for( var i in search ){// TODO: rewrite it normally, it's an array
                subject = subject.replace( search[i], replace[i] || '' );
            }
            return subject;
        },

        /*
         function: buildLine
         Builds php or js string. It's about access to ancestors variables.

         Parameters:
         text - variable string
         logic - <logicUnit>
         bool php - if true - php || js
         checkVars - if true - vars would be checked for existance

         Return:
         formatted text
         */
        buildLine: function( text, logic, php, checkVars ){
            if( php === undefined ) php = false;
            if( checkVars === undefined )
                checkVars = this.options.checkVars;
            for( var i = logic.length; i ; ){
                //if( logic[ --i ][ 's' ] ){
                //logic[ --i ][ 'v' ] = this.buildLine( logic[ i ][ 'v' ][ 't' ], logic[ i ][ 'v' ][ 'v' ], php, checkVars );
                //text = text.replace( logic[ i ][ 'n' ], '\'' + ( php ? '.' : '+' ) + '(' + ( logic[ i ][ 'v' ] ) + ')' + ( php ? '.' : '+' ) + '\'' );
                //} else{

                text = text.replace( new RegExp( this.escapeRegExp(logic[ --i ][ 'n' ]),'g'), this.makeVariableName( logic[ i ], php, checkVars ) );
//            }
            }
            return text;
        },

        /*
         function: braceVar
         add braces and quotes to var name

         Parameters:
         aVar - variable string
         bool autoQuote - if true - don't add quotes

         Return:
         formatted var
         */
        braceVar: function( aVar, autoQuote ){

            return autoQuote !== undefined ? '[' + aVar + ']' : '[\'' + aVar + '\']';
        },

        /*
         function: makeVariableName
         make full variable name

         Parameters:
         aVar - variable string
         bool php - if true - php || js
         checkVars - if true - vars would be checked for existance

         Return:
         formatted var name
         */
        makeVariableName: function( aVar, php, checkVars ){
            var tmp;
            if( checkVars === undefined )
                checkVars = this.options.checkVars;

            if( php === undefined ) php = false;

            var tmpText = aVar[ 'v' ],
                nextDot, nextBrace, nextPos, bite, state, levelUp,
                text = '';

            if( tmpText.charAt(0) === '$' && (tmp = tmpText.charAt(1)) !== '(' && tmp !== '.' ){
                tmpText = 'vars.'+ tmpText.substr(1);
            }

            if( aVar[ 'f' ] ){
                return tmpText;
            }

            levelUp = 0;
            while( tmpText.indexOf( '.' ) === 0 ){
                levelUp++;
                tmpText = tmpText.substr( 1 );
            }

            state = 0; //0 = first | 1 = [] | 2 = .

            do{
                nextDot = tmpText.indexOf( '.' );
                nextBrace = tmpText.indexOf( '[' );

                if( nextDot === -1 && nextBrace === -1 ){
                    nextPos = tmpText.length;
                } else{
                    if( nextDot === -1 || nextBrace === -1 ){
                        nextPos = Math.max( nextDot, nextBrace );
                    } else{
                        nextPos = Math.min( nextDot, nextBrace );
                    }
                }
                bite = tmpText.substr( 0, nextPos );

                if( state === 0 ){
                    if( bite === 'el' )
                        bite = '__el';
                    text += this.braceVar( bite );
                } else if( state === 1 ){
                    text += this.braceVar( bite.substr( 0, bite.length - 1 ), false );
                } else{
                    text += this.braceVar( bite );
                }
                if( nextPos === nextBrace ){
                    state = 1;
                } else{
                    state = 2;
                }

                tmpText = tmpText.substr( nextPos + 1 );

            } while( tmpText !== '' );

            if( php ){
                text = '$i[' + levelUp + ']' + text;
                if( checkVars ){
                    text = '(isset(' + text + ')?' + text + ':\'\')';
                }
            } else{
                text = (levelUp === 0 ? 'p' : 'i[' + levelUp + ']') + text;
                if( checkVars ){
                    text = '(' + text + '==null?\'\':' + text + ')';
                }
            }


            return text;
        },
        toString: Object.prototype.toString,

        /*
         function: trim
         right trim

         Parameters:
         text - text to trim

         Return:
         right trimmed text
         */
        trim: function( text ){
            return (text || "").replace( rtrim, "" );
        },

        /*
         function: isArray
         check if obj is Array

         Parameters:
         obj - object to check

         Return:
         true if array || false
         */
        isArray: function( obj ){
            return this.toString.call( obj ) === "[object Array]";
        },

        /*
         function: toArray
         makes array

         Parameters:
         obj - object to check

         Return:
         obj if is Array || [ obj ]
         */
        toArray: function( obj ){
            return this.isArray( obj ) ? obj : [obj];
        },

        /*
         function: lCase
         toLowerCase wrapper

         Parameters:
         text - text to lower

         Return:
         lowered text
         */
        lCase:function( text ){
            return text.toLowerCase();
        },

        /*
         function: addSlashes
         wraps slashes with more slashes

         Parameters:
         text - text to add slashes

         Return:
         slashed text
         */
        addSlashes: function( str ){
            return str.replace( /\\/g, '\\\\' ).replace( /\'/g, '\\\'' );
        },

        /*
         function: getJSF
         return JS template function

         Parameters:
         text - text of logic template

         Return:
         <LogicTplUnit>
         */
        getJSF: function( text ){
            return ( new LogicTplUnit( new Function('vars', this.getCode(text)) ) );
        },
        getCode: function( text ){
            var jsCode = 'var i = [vars],p=i[0],p1,r = \'\',o = this.o, l = this.l;this.c = {};';
            jsCode += this.parse( text ).generateJS();
            jsCode += 'return r;';
            return jsCode;
        },
        tplList: {},
        renderers: {},
        tplGroup: {},
        loadTpl: function( dirName, name, prefix ){
            var joined = prefixJoin(prefix,name);
            if(prefix)
                this.tplGroup[prefix].push(joined);
            this.tplList[joined] = this.getJSF( fs.readFileSync( dirName +'/'+ name +'.html', 'utf-8' ) );
            this.renderers[joined] = this.render.bind(this, name);
        },
        render: function( name, obj ){
            var tpl = this.tplList[ name ];
            return !tpl ? null : tpl.f(obj || {});
        },
        loadGroup: function (dirName, name, prefix) {
            this.loadAll(Path.join(dirName, name), prefixJoin(prefix,name));
        },
        loadAll: function( dirName, prefix ){
            dirName = dirName || 'tpl';
            fs.readdirSync(dirName).forEach(function( fullName ){
                var info = fs.lstatSync( Path.join(dirName,fullName) );
                var name = fullName.replace('.html','');
                if(info.isFile()) {
                    this.loadTpl(dirName, name, prefix);
                }else {
                    this.tplGroup[prefixJoin(prefix,fullName)] = [];
                    this.loadGroup(dirName, fullName, prefix);
                }
            }.bind(this));
        }
    };
    module.exports = new LogicTemplate();
    var toString = Object.prototype.toString;
    LogicTplUnit = function( f ){
        this.f = f;
    };
    LogicTplUnit.prototype = {
        ctor: function( f ){
            this.f = f;
        },
        c: {},
        collectorPop: function( name ){
            return this.c[ name ].pop();
        },
        collectorGetLast: function( name ){
            return this.c[ name ][ this.length - 1 ];
        },

        /*
         Function: collectorNew
         Creates collectors. Use in tpls
         (code)
         this.collectorNew( 'button', 'item', 'ololo' .. )
         (end code)

         */
        collectorNew: function( ){

            for( var i = arguments.length; i; ){
                this.c[ arguments[ --i ] ] = [];
            }
            return '';
        },

        /*
         Function: collectorPush
         Pushes element in collector

         Parameters:
         name - collector name
         val - value to push

         (code)
         this.collectorPush( 'button', el.value )
         (end code)

         */
        collectorPush: function( name, val ){
            this.c[ name ].push( val );
            return '';
        },

        /*
         Function: o
         Function makes object from Array or pass as is if object. Cool named function to minimize template code.

         Parameters:
         o - object

         Return:
         Array ? object || as is

         */
        o: function( a ){
            var type = toString.call( a );
            if( type === "[object Array]" ){
                var out = {};

                for( var i = 0, j = a.length; i < j; i++ )
                    out[ i ] = a[ i ];
                return out;
            }else if( type === "[object Object]"){
                return a;
            }
            return {};
        },

        /*
         Function: l
         Get Object\Array length. Cool named function to minimize template code.

         Parameters:
         o - object

         Return:
         length

         */
        l:  ( Object.keys ?
            function( o ){
                var type = toString.call( o );
                if( type === "[object Array]" ){
                    return o.length;
                }else if( type === "[object Object]" ){
                    return Object.keys( o ).length;
                }
            }
            :
            function( o ){
                var type = toString.call( o );
                if( type === "[object Array]" ){
                    return o.length;
                }else if( type === "[object Object]" ){
                    var count = 0;
                    for( var k in o )if( o.hasOwnProperty( k ) )
                        count++;
                    return count;
                }
            }
            ),

        formatText: function( text ){
            return text.replace(/\n/g,'<BR>').replace(/\t/g,'&nbsp;&nbsp;&nbsp; ');
        },
        json: function (o) {
            return JSON.stringify(o);
        },
        iso: function (o) {
            return '$$$$$';
        }
    };


})();