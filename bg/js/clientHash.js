var fs = require( 'fs' );
var crypto = require( 'crypto' );

// the file you want to get the hash
GLOBAL.special = Z.UUID.someRandom();
var filename = './public/bg.min.js';
fs.stat( filename, function( err, stat ){
    if( !err ){
        var fd = fs.createReadStream( filename );
        var hash = crypto.createHash( 'sha1' );
        hash.setEncoding( 'hex' );

        fd.on( 'end', function(){
            hash.end();
            GLOBAL.special = hash.read();
            console.log( 'Hash: ' + GLOBAL.special ); // the desired sha1sum
        } );

        fd.pipe( hash );
    }
} );


