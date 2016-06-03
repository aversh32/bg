var clc = require('cli-color');
var err = clc.redBright;
var TestCase = function( controller ){
    this.controller = controller;
};
TestCase.prototype = {

};
var Test = function(  ){
    var self = this;
    this.caseCount = 0;
    return function( name, callback ){
        self.caseCount++;
        /*try{*/
            callback(new TestCase(self));
        /*}catch(e){
            console.log('   > ' + err(name));
            debugger;
            console.dir(e);
            return;
        }*/
        console.log(name);
    };
};

var tests = Z.include('./test/', function( tests ){
    Z.each(tests, function( name, data ){
        console.log(clc.cyanBright('Tests from '+ name));
        var testInstance = new Test();
        (data || []).forEach( function(testCase){
            console.log(' - '+clc.cyanBright(testCase.name));
            if( testCase.fn ){
                testCase.fn(testInstance);
            }else{
                console.log(err('No test function'));
            }
        })

    });
});

