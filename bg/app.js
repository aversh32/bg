/**
 * Created by Ivan on 11/20/2014.
 */
var cluster = require('cluster');										//Модуль для возможности создания дочерних процессов
var http = require('http');
var numCPUs = require('os').cpus().length;								//Количество процессоров

if (cluster.isMaster) {													//Истина, если процесс является мастером									

  var fs = require('fs');
  fs.writeFile("/var/tmp/trololo.pid", process.pid, function(err) {							//process.pid - идентификатор процесса
      console.log('MASTER PID IS ',process.pid, err);
  });

  // Fork workers.
  var workers = [];
  for (var i = 0; i < numCPUs; i++) {
    workers.push(cluster.fork());														//Создание нового рабочего процесса?
  }

  cluster.on('exit', function(worker, code, signal) {									//Когда один из рабочих процессов умирает, кластер генерирует вызов "exit"
    console.log('worker ' + worker.process.pid + ' died');								
    if( workers.indexOf(worker) > -1 )													//если процесс существует, 
      cluster.fork();																			//то создаем новый дочерний процесс
  });
  var restart = function( r ){															
    if( restart.in )																	//если флаг     .in =true возврат
      return;				
    restart.in = true;																	//иначе флаг=тру
    var copy = workers.slice();															//копируем список существующих процессов													
    var f = function(){						
      var w = copy.shift();																//извлечение 1 эл-та массива в переменную w
      workers.splice(workers.indexOf(w),1);												//удаление из workers первого элемента
      w.destroy();																		
      workers.push(cluster.fork({r:r}));												//создание нового дочернего процесса и его добавление в массив процессов с параметром r ????????
      if( copy.length )																	//если copy не пуст, то 
        setTimeout(f,1000);																//вызвать функцию f через 1000мс
      else
        restart.in = false;																//иначе флаг рестарт = ложь
    };
    if( copy.length )																	
      setTimeout(f,1000);
    else
      restart.in = false;
  };
  http.createServer(function (req, res) {													

    var tokens = req.url.split('?' ),
      data = {};
    tokens[1] && tokens[1].split('&').forEach( function( el ){
      var tokens = el.split('=');
      data[decodeURIComponent( tokens[0])] = decodeURIComponent(tokens[1]);
    });
    res.writeHead(200, {'Content-Type': 'text/plain'});

    if( data.release ){
      res.end('Release '+data.release+'\n');
      restart(data.release);
    }else
      res.end('Hello World\n');

  }).listen(3666);
} else {
  // Workers can share any TCP connection
  // In this case its a HTTP server
  console.log('START PROCESS ' + process.pid);
  if(process.env && process.env.r)
    require('../'+process.env.r+'/app-worker');
  else
    require('./app-worker');
}