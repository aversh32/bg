/**
 * Created by Ivan on 7/27/2015.
 */
var fs = require('fs'),
    path = require('path'),
    base = path.dirname(process.mainModule.filename),
    count = 0,
    lines = 0,
    symbols = 0,
    total = 0,
    noCommentTotal = 0,
    getFiles = function (dirName) {
        console.log('DIR: '+dirName);
        var list = fs.readdirSync(dirName).forEach(function (fullName) {
            if(fullName === 'node_modules')return;
            if(fullName === 'bower_components')return;
            if(fullName === 'coverage')return;
            if(fullName === '.git')return;
            if(fullName === '.idea')return;
            var name = path.join(dirName, fullName);
            var info = fs.lstatSync( name );
            if(info.isFile()) {
                if(name.substr(-4)==='.css'){
                    count++;
                    var data = fs.readFileSync(name)+'';
                    total += data.length;

                    data = data.replace(/\\\\.*[\n\r]*?/g,'')
                        .replace(/\/\*.+?\*\/|\/\/.*(?=[\n\r])/g, '');
                    noCommentTotal += data.length;

                    lines += data
                        .split('\n').length;
                }
            }else if(info.isDirectory()) {
                getFiles(name);
            }
        });

    },

    dir = process.argv.slice(2);

getFiles(base);
console.log('file count', count);
console.log('total symbol count', total);
console.log('total not comment symbol count', total);
console.log('not comment lines count', lines);
