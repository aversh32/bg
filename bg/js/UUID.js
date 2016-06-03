GLOBAL.Z.UUID = {
    /*
     Function: getRandom
     Function that returns random UUID

     Return:
     somthing like this - 6740c54A-0141-4Fe0-9742-6A4971F2A6cb
     *//*cut*/
    getRandom: (function(){
        var hexDigit = '0123456789abcdefABCDEF'.split( '' ),
            rad = hexDigit.length;
        return function(){
            var uid = '', i;

            for( i = 0; i < 8; i++ ) uid += hexDigit[ Math.floor( Math.random() * rad ) ];
            uid += '-';

            for( i = 9; i < 13; i++ ) uid += hexDigit[ Math.floor( Math.random() * rad ) ];
            uid += '-4';

            for( i = 15; i < 18; i++ ) uid += hexDigit[ Math.floor( Math.random() * rad ) ];
            uid += '-';
            uid += hexDigit[ ( Math.floor( Math.random() * rad ) & 0x3 ) | 0x8 ];

            for( i = 20; i < 23; i++ ) uid += hexDigit[ Math.floor( Math.random() * rad ) ];
            uid += '-';

            for( i = 24; i < 36; i++ ) uid += hexDigit[ Math.floor( Math.random() * rad ) ];

            return uid;
        };
    })(),/*end cut*/
    someRandom: function(  ){
        return Math.random().toString(36 ).substr(3,7)+
            Math.random().toString(36 ).substr(3,7)+
            Math.random().toString(36 ).substr(3,7);
    },
    currentUID: 0,
    /*
     Function: get
     get unique numeric id (there is a counter of riching this function from application start)

     Return:
     number
     */
    get: function(){
        return ++this.currentUID;
    },
    getCurrentUID: function () {
        return this.currentUID + 1;
    }
};