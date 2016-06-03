
var stdin = process.stdin;

// without this, we would only get streams once enter is pressed
stdin.setRawMode( true );

// resume stdin in the parent process (node app won't quit all by itself
// unless an error or process.exit() happens)
stdin.resume();

// i don't want binary, do you?
stdin.setEncoding( 'utf8' );

// on any data into stdin
var w = ''
stdin.on( 'data', function( key ){
    // ctrl-c ( end of text )
    console.log(key.charCodeAt(0));
    if ( key === '\u0003' ) {
        process.exit();
    }
    // write the key to stdout all normal like
    //w+=key;
    //process.stdout.write( w);//key+'\n' );
});

//
//stdin.addListener("readable", function(d) {
//    // note:  d is an object, and when converted to a string it will
//    // end with a linefeed.  so we (rather crudely) account for that
//    // with toString() and then substring()
//    console.log("you entered: [" +
//        d.toString().substring(0, d.length-1) + "]");
//});
