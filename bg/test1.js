/*
var sys = require('sys');
var exec = require('child_process').exec;
exec("echo 44 > 2");//./toutf "+file, { encoding: 'utf8', maxBuffer: 1024*1024*10 }, function(err, stdout, stderr){*/


var ass = require('./js/ass')

var x = 0,y=0;
var i = setInterval( function(  ){
    console.log('!', y++);
},10)
var j1 = 0, j2 = 0;
var d = +new Date();
ass.each(new Array(2500), function(arr){j1++;/*console.log(x++,arr.length);*/}, 3, function(  ){
    console.log(j1);
    console.log(+new Date() - d);
    console.log('end');
    clearInterval(i);
});

var d = +new Date();
ass.each2(new Array(25000000), function(arr){j2++;/*console.log(x++,arr.length);*/}, 100000, function(  ){
    console.log(j2);
    console.log(+new Date() - d);
    console.log('end');
    clearInterval(i);
});