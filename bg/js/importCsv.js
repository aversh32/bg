module.exports = function( app ){
    var formidable = require('formidable');
    app.post('/uploadFile', function( request, response ) {
        console.log( "Request for 'upload' is called." );
        var form = new formidable.IncomingForm();
        console.log( "Preparing upload" );

        form.parse( request, function( error, fields, files ) {
            console.log( "Completed Parsing" );
            var resp = App.response(response);
            if( error ){
                resp.error( 'bad request' );
                return;
            }

            api.authorize.getUserByHash({hash: request.cookies.u}, function( user ){
                if(!user){
                    resp.error( 'please login' );
                    return;
                }

                //api.contactList.get({id: fields.id, user: user}, function( list ){

                    var file = files.file.path,
                        phoneName = fields.phoneName||'phone',
                        nameName = fields.nameName||'name',
                        escapeChar = fields.escape;

                    var sys = require('util');
                    var exec = require('child_process').exec;
                    var newLines = function (text) {
                        var stripped = text.replace(/\r/g,'')
                        if(stripped.split('\n').length<text.split('\r').length/2){
                            return text.replace(/\r/g,'\n').replace(/\n\n/g,'\n').replace(/\n\n/g,'\n');
                        }
						console.log("stripped    "+stripped);
                        return stripped;

                    }
                    //var spawn = require('child_process').spawn;
                    exec("./toutf "+file, { encoding: 'utf8', maxBuffer: 1024*1024*20 }, function(err, stdout, stderr){
//                        debugger;

                      //  debugger;
                        if (err){
                            var fs = require('fs');
                            fs.readFile(file, function( err, stdout ){
                                if( err ){
                                    console.dir(err);
                                    resp.error( 'error' );
                                    return;
                                }else{
                                    var data = newLines(stdout.toString()).replace(/\r/g,'');
                                    resp.iframeOk( {id: fields.id, data: data} );
                                }
                            })
                            return;
                        }
                        var data = newLines(stdout.toString());
                        resp.iframeOk( {id: fields.id, data: data} );

                    });
                //});
            /*
            var file = files.avatar;
            var path = file.path,
                name = path.substr(path.lastIndexOf('/'+1));
            var newName = Z.UUID.getRandom() +'.jpg';
            var newPath = '/upload/origin/'+ newName;
            fs.rename( file.path , '/mnt/sharedfs/billingrad/'+newPath, function(  ){

                var resizedName = '/upload/thumb/'+ newName;
                im.resize({
                    srcPath: '/mnt/sharedfs/billingrad/'+newPath,
                    dstPath: '/mnt/sharedfs/billingrad/'+resizedName,
                    width:   125
                }, function(err, stdout, stderr){
                    if (err)
                        resp.error('Error resizing');
                    else
                        resp.ok({path: resizedName, name: newName});
                });

            } ); // Update the streamed filename with it's original filename
    */
            });
        });
    });
}
