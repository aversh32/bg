/**
 * Created by Ivan on 10/21/2014.
 */
var Pool = require('sandcastle').Pool;

var poolOfSandcastles = new Pool(
    { numberOfInstances: 2 },
    { timeout: 100, refreshTimeoutOnTask : true }
);





var Z = require('./js/Z' );
var tpl = require('./js/tpl' );
var code = '{{i}}) mimimi{{a}}' +
    //'{{obj.b}}' +
    '{{if c}}c{{/if}}' +
    '{{foreach arr}}text{{el.value}}{{/foreach}}';

var data = {c:2, obj:1, arr: [1,2,3]};
var tplFn = tpl.getCode(code);
code = tpl.getJSF(code);
var proto = '{o:'+(code.o+'')+',l:'+(code.l+'')+'}';


/*var script = poolOfSandcastles.createScript('\
  var tpl = function(){};\
  tpl.prototype = '+proto+';var c=1;\
  exports = {main: function() {\
    //var t = new tpl();\
    //t.f = new Function(\'vars\',f);\
    exit("222")\
    //return( t.f(data));\
  }};\
');*/
var script = poolOfSandcastles.createScript('\
  var tpl = function(){};\
  tpl.prototype = '+proto+';var c=1;\
  exports = {main: function() {\
    exit(true)\
    return c++;\
  }};\
');
script.on('exit', function( err, output, methodName) {
    console.log(output,methodName); // foo, bar, hello
});

for(var i = 0; i < 100; i++){
    var d = Object.create(data);
    d.i = i;
    var ta = script.run( {f: tplFn, data: d}, function(  ){
        console.log('!')
    } );
}

//console.log(ta);
/*
//console.log(code);
//for(var i = 0; i < 100; i++)
sb.run('var x = function(){};' +
'x.prototype='+proto+';' +
'onmessage = function(a){' +
    'a = JSON.parse(a);' +
    'var tpl = new x(); ' +

    'tpl.f=new Function(\'vars\',a[0]);' +
    //'postMessage(tpl.f(2));' +
    'postMessage(a[2]+\',\'+tpl.f(a[1]));' +
    //'postMessage(tpl.f(a[1]));' +
'};', function( out ){
    console.log(out)
});
sb.on('message', function(message){
  console.log( message )
});
var c = 0;
//for(var i = 0; i < 100; i++)
sb.postMessage(JSON.stringify([tplFn,data,c++]));
setTimeout( function(  ){
    //console.dir(sb);
},100)
*/
/*code = 'var f = function(text){ return new Function("vars", text ); };\n'+
    'f("'+code+'")('+JSON.stringify(data)+')';
console.log(code);
sb.run( code, function( output ) {
  console.log( output )
});*/
//(Function(vars){var i = [vars],p=i[0],p1,r = '',o = this.o, l = this.l;this.c = {};r+='mimimi';r+=(p['a']==null?'':p['a']);r+=(p['obj']['b']==null?'':p['obj']['b']);if((p['c']==null?'':p['c'])){r+='c';}return r;})({})
