/*var amqp = require('amqp');
var connection = amqp.createConnection({ host: "localhost", port: 5672 });
var count = 1;

connection.on('ready', function () {
  var sendMessage = function(connection, queue_name, payload) {
    var encoded_payload = JSON.stringify(payload);  
    connection.publish(queue_name, encoded_payload);
  };

  setInterval( function() {
    var send = 10000, d = +new Date();
    for( var i = 0; i < send; i++ ){
        var test_message = '{a:1,b:2,c:3,d:4,something:'+count+',e:6,zhzh:"llwanflwanflwainflnawlifnailfnlainflianwflinalifnlawinfliawnflianflinawlifn"}';
        sendMessage(connection, "my_queue_name3", test_message);
        count += 1;
    }
    console.log( send + ' messages in '+ ((+new Date()) - d ) );
    console.log( count );
  }, 0);
});*/
require('./js/MQ');
/*setInterval( function(  ){
    var send = 1000, d = +new Date();
    for( var i = 0; i < send; i++ ){
        Z.MQ.send( 'my_queue_name3', i );
    }
    console.log( send + ' messages in '+ (( + new Date() ) - d ) );
}, 200 );*/
var c = 1, req = 0, resp = 0;


setInterval( function(  ){
    c++;
    //console.log(c);
    for( var i = 0; i < 1000; i++ ){
        req++;
        Z.MQ.apiRequest('test', 'testSum', {a: c, b: i}, function( c,i,data ){
            resp++;
            if( data.sum !== c+i)
                console.log(data);

        }.bind(this,c,i));
    }
},10);
setInterval( function(  ){
    console.log(req,resp);
},1001);


/*
10000 messages in 31
10001
10000 messages in 943
20001
10000 messages in 757
30001
10000 messages in 1010
40001
10000 messages in 1004
50001
10000 messages in 1004
60001
10000 messages in 1073
70001
10000 messages in 968
80001
10000 messages in 1218
90001
10000 messages in 1104
100001
10000 messages in 1904
110001
10000 messages in 1223
120001
10000 messages in 1179
130001
10000 messages in 874
140001
10000 messages in 939
150001
10000 messages in 910
160001
10000 messages in 1016
170001
10000 messages in 1041
180001
10000 messages in 959
190001
10000 messages in 1004
200001
10000 messages in 863
210001
10000 messages in 1204
220001
10000 messages in 1507
230001
10000 messages in 1439
240001
10000 messages in 1448
250001
10000 messages in 1484
260001
10000 messages in 1355
270001
10000 messages in 1407
280001
10000 messages in 1408
290001
10000 messages in 1480
300001
10000 messages in 1406
310001
10000 messages in 1349
320001
10000 messages in 1640
330001
10000 messages in 3508
340001
10000 messages in 1987
350001
10000 messages in 6290
360001
10000 messages in 2539
370001
10000 messages in 987
380001
10000 messages in 1350
390001
10000 messages in 1135
400001
10000 messages in 1010
410001
10000 messages in 2842
420001
10000 messages in 2048
430001
10000 messages in 938
440001
10000 messages in 1759
450001
10000 messages in 2185
460001
10000 messages in 1566
470001
10000 messages in 1451
480001
10000 messages in 1954
490001
10000 messages in 1531
500001
10000 messages in 1652
510001
10000 messages in 1479
520001
10000 messages in 1442
530001
10000 messages in 1396
540001
10000 messages in 1455
550001
10000 messages in 1494
560001
10000 messages in 1391
570001
10000 messages in 1509
580001
10000 messages in 3491
590001
10000 messages in 1786
600001
10000 messages in 1146
610001
10000 messages in 1199
620001
10000 messages in 2124
630001
10000 messages in 1607
640001
10000 messages in 1639
650001
10000 messages in 1509
660001
10000 messages in 1499
670001
10000 messages in 1556
680001
10000 messages in 1808
690001
10000 messages in 1823
700001
10000 messages in 1902
710001
10000 messages in 1639
720001
10000 messages in 1273
730001
10000 messages in 1060
740001
10000 messages in 1230
750001
10000 messages in 1381
760001
10000 messages in 1508
770001
10000 messages in 1664
780001
10000 messages in 1517
790001
10000 messages in 1506
800001
10000 messages in 1544
810001
10000 messages in 1760
820001
10000 messages in 2920
830001
10000 messages in 1457
840001
10000 messages in 1340
850001
10000 messages in 2734
860001
10000 messages in 1527
870001
10000 messages in 1416
880001
10000 messages in 1407
890001
10000 messages in 1962
900001
10000 messages in 1446
910001
10000 messages in 1420
920001
10000 messages in 1386
930001
10000 messages in 1388
940001
10000 messages in 1424
950001
10000 messages in 1399
960001
10000 messages in 1339
970001
10000 messages in 1591
980001
10000 messages in 1743
990001
10000 messages in 1654
1000001
10000 messages in 1595
1010001
10000 messages in 1518
1020001
10000 messages in 1618
1030001
10000 messages in 1522
1040001
10000 messages in 1708
1050001

 */