exports = module.exports = (function(){
    'use strict';
    return {};
    var needle = require('needle');


    needle.post(
        'https://178.20.234.188/RuRu.FrontEnd.ServiceProvider/TransactionService.svc',null,
        {
            key: fs.readFileSync('../cert/dev4.blgrd.net.key'),
            cert: fs.readFileSync('../cert/dev4.blgrd.net.crt')
        /*
pfx: Certificate, Private key and CA certificates to use for SSL.
key: Private key to use for SSL.
passphrase: A string of passphrase for the private key or pfx.
cert: Public x509 certificate to use.
ca: An authority certificate or array of authority certificates to check the remote host against.
ciphers: A string describing the ciphers to use or exclude.
rejectUnauthorized: If true, the server certificate is verified against the list of supplied CAs. An 'error' event is emitted if verification fails. Verification happens at the connection level, before the HTTP request is sent.
secureProtocol: The SSL method to use, e.g. SSLv3_method to force SSL version 3.
         */
    }, function( a, b ){
        console.log(a,b&&b.body)
    });
    return {
    };
})();