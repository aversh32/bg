var util   = require('util');
var spawn = require('child_process').spawn;
var ssh    = spawn('ssh', ['127.0.0.1']);

ssh.stdout.on('data', function (data) {
  console.log('stdout: ' + data);
});

ssh.stderr.on('data', function (data) {
  console.log('stderr: ' + data);
});

ssh.on('exit', function (code) {
  console.log('child process exited with code ' + code);
});