
require('./js/MQ');
var c = 0, send = 1000, d = +new Date();
Z.MQ.subscribe( 'my_queue_name3', function( msg ){
    c++;

    if( c === send){
          c=0;
          console.log( 'recieved '+ send + ' messages in '+ ((+new Date())-d) +'!'+ msg);
          d = +new Date();
      }
} );

Z.MQ.subscribe( 'api.test', function( method, data ){

});





/*var amqp = require('amqp');
var connection = amqp.createConnection({ host: "localhost", port: 5672 });
connection.on('ready', function () {
  connection.queue("my_queue_name3", {autoDelete: false}, function(queue){
    queue.bind('#');
    var c = 0, send = 10000, d = +new Date();
    queue.subscribe(function (message) {
      c++;
      var encoded_payload = unescape(message.data);
      var payload = JSON.parse(encoded_payload);
      if( c === send){
          c=0;
          console.log( 'recieved '+ send + ' messages in '+ ((+new Date())-d));
          d = +new Date();
      }
    })
  })
})
/*
recieved 10000 messages in 1118
recieved 10000 messages in 664
recieved 10000 messages in 709
recieved 10000 messages in 1612
recieved 10000 messages in 3848
recieved 10000 messages in 3429
recieved 10000 messages in 3303
recieved 10000 messages in 3384
recieved 10000 messages in 3610
recieved 10000 messages in 3999
recieved 10000 messages in 3827
recieved 10000 messages in 3009
recieved 10000 messages in 3209
recieved 10000 messages in 4741
recieved 10000 messages in 4215
recieved 10000 messages in 5883
recieved 10000 messages in 3725
recieved 10000 messages in 5890
recieved 10000 messages in 6151
recieved 10000 messages in 5340
recieved 10000 messages in 5622
recieved 10000 messages in 6088
recieved 10000 messages in 5878
recieved 10000 messages in 6018
recieved 10000 messages in 6094
recieved 10000 messages in 5995
recieved 10000 messages in 6134
recieved 10000 messages in 7898
recieved 10000 messages in 6572
recieved 10000 messages in 7901
recieved 10000 messages in 8594
recieved 10000 messages in 7688
recieved 10000 messages in 6166
recieved 10000 messages in 4848
recieved 10000 messages in 2616
recieved 10000 messages in 2551
recieved 10000 messages in 2343
recieved 10000 messages in 2509
recieved 10000 messages in 2299
recieved 10000 messages in 3106
recieved 10000 messages in 2962
recieved 10000 messages in 3045
recieved 10000 messages in 3189
recieved 10000 messages in 2711
recieved 10000 messages in 2476
recieved 10000 messages in 3040
recieved 10000 messages in 3021
recieved 10000 messages in 2705
recieved 10000 messages in 2700
recieved 10000 messages in 2969
recieved 10000 messages in 3141
recieved 10000 messages in 3009
recieved 10000 messages in 3052
recieved 10000 messages in 2511
recieved 10000 messages in 2643
recieved 10000 messages in 2584
recieved 10000 messages in 2409
recieved 10000 messages in 2429
recieved 10000 messages in 2767
recieved 10000 messages in 3470
recieved 10000 messages in 2666
recieved 10000 messages in 2890
recieved 10000 messages in 3275
recieved 10000 messages in 3226
recieved 10000 messages in 2441
recieved 10000 messages in 3227
recieved 10000 messages in 3155
recieved 10000 messages in 2936
recieved 10000 messages in 2574
recieved 10000 messages in 3485
recieved 10000 messages in 3204
recieved 10000 messages in 3472
recieved 10000 messages in 2969
recieved 10000 messages in 2843
recieved 10000 messages in 3070
recieved 10000 messages in 2302
recieved 10000 messages in 2906
recieved 10000 messages in 2590
recieved 10000 messages in 2425
recieved 10000 messages in 2671
recieved 10000 messages in 2847
recieved 10000 messages in 3050
recieved 10000 messages in 2831
recieved 10000 messages in 2618
recieved 10000 messages in 2849
recieved 10000 messages in 3104
recieved 10000 messages in 4973
recieved 10000 messages in 3302
recieved 10000 messages in 2780
recieved 10000 messages in 2688
recieved 10000 messages in 2965
recieved 10000 messages in 1846
recieved 10000 messages in 785
recieved 10000 messages in 820
recieved 10000 messages in 765
recieved 10000 messages in 874
recieved 10000 messages in 718
recieved 10000 messages in 744
recieved 10000 messages in 562
recieved 10000 messages in 691
recieved 10000 messages in 711
recieved 10000 messages in 552
recieved 10000 messages in 782
recieved 10000 messages in 590
recieved 10000 messages in 548

 */