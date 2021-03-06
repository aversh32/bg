/**
 * Created by Ivan on 11/16/2014.
 */
var redis = require("redis");

var Z = require('z-lib');
var Cosher = function( cfg ){
    this.unique = Z.UUID.getRandom();

    Z.apply(this, cfg);
    this._initConnections();
    this.hash = this.hash || {};
    this.timeouts = {};
    this._subscribe();
    this.timeout && this._timeout();
};
Cosher.prototype = {
    _initConnections: function(  ){
        if (!Cosher.prototype.client) {
            Cosher.prototype.client = redis.createClient(this.connectCfg);
            Cosher.prototype.client.on("error", function (err) {
                console.log("Error " + err);
            });
        }
        if (!Cosher.prototype.sclient) {
            Cosher.prototype.sclient = redis.createClient(this.connectCfg);
            Cosher.prototype.sclient.on("error", function (err) {
                console.log("Error " + err);
            });
        }
    },
    _timeout: function(  ){
        setTimeout( function(  ){
            this._findRetarded();
            this._timeout();
        }.bind(this), this.timeout*1000);
    },
    _findRetarded: function(  ){
        var i, x = 0, c = 0, g = 0,
            timeouts = this.timeouts,
            hash = this.hash,
            item,
            epsonSince = +new Date() - this.timeout*1000,
            d = (Math.log(Math.random()+1)/Math.log(2)*5+1)|0;

        for( i in timeouts ) if( timeouts.hasOwnProperty(i) ){
            x++;
            if( x%d===0 ){
                c++;
                if( c > 100 )
                    if( g < 25 ){
                        break;
                    }else{
                        c = 0;
                    }

                item = timeouts[i];
                if( item < epsonSince ){
                    delete timeouts[i];
                    delete hash[i];
                }
            }
        }
    },
    _subscribe: function(  ){
        var name = this.name,
            hash = this.hash,
            unique = this.unique,
            timeouts = this.timeouts;
        this.sclient.psubscribe( this.name +'/*' );
        this.sclient.on('pmessage', function( pattern, channel, message ){
            var tokens = channel.split( '/' );
            if( tokens[0] === name && (tokens[1] in hash) && tokens[2] !== unique ){
                delete hash[tokens[1]];
                delete timeouts[tokens[1]];
            }
        });
    },
    retry: 10,
    change: function( id ){
        var el = this.hash[id];
        if( el ){
            this.client.hset( [this.name, id, JSON.stringify( el )], function(){} );
            this.client.publish( this.name + '/' + id + '/' + this.unique, '' );
        }
    },
    remove: function( id ){
        this.client.hdel( [this.name, id], function(){} );
        this.client.publish( this.name + '/' + id + '/' + this.unique, '' );
        delete this.hash[id];
        delete this.timeouts[id];
    },
    get: function( id, cb ){
        var hash = this.hash, item,
            timeouts = this.timeouts,
            _self = this,
            later = function(  ){
                cb( id in hash, hash[id] );
                timeouts[id] = +new Date();
            },
            client = this.client;
        if( item = hash[id] ){
            if( item instanceof Z.wait.constructor ){
                item.after( later );
            }else
                later();
        }else{
            hash[id] = Z.wait(later);
            hash[id].add();
            var after = function( val ){
                    var waiter = hash[id];
                    hash[id] = val;
                    waiter && waiter.done && waiter.done();
                },
                myName = '!wait:'+this.unique,
                retry = this.retry;
            client.hget( [_self.name, id], function( err, val ){
                console.log(';'+id);
                if( !err && val !== null ){
                    if( val.indexOf('!wait:') === 0 ){
                        setTimeout(_self.get.bind(_self,id,cb),retry);
                    }else{
                        after(JSON.parse(val));
                    }
                }else{
                    console.log('Ё'+id);
                    client.hsetnx([_self.name, id, myName], function( err, reply ){
                        if( reply === 1 ){
                            _self.query(id, function(err, qVal){
                                after(qVal);
                                client.hset( [_self.name, id, JSON.stringify( qVal )], function(){} );
                            });
                        }else{
                            setTimeout(_self.get.bind(_self,id,cb),retry);
                        }
                    });
                }
            } );
        }
    }
};
var f = function () {


var once = {};
var cfg = {
    name: 'projecti',
    idKey: 'pid',
    index: ['pid', 'name'],
    timeout: 60,
    storeTimeout: 150,
    connectCfg: App.cfg.redis,
    query: function( id, cb ){
        setTimeout( function(  ){
            if( once[id] )
                console.log('!'+id);
            else{
                console.log('+'+id);
                once[id] = true;
                cb( false, {pid: id, tro: 'lolo'} );
            }
        },3000);
    },
    update: function( id, data, cb ){

    }
};
var projects = new Cosher(cfg);
var projects2 = new Cosher(cfg);

var c = 0, k=0;
setInterval( function(  ){
    var m = 1500,
            need = (Math.random() * m) | 0,
            need2 = (Math.random() * m) | 0;
    projects.change(need);
    projects2.change(need2);
},500)
setInterval( function(){
    for( var i = 0; i < 1000; i++){
        var m = 1500,
            need = (Math.random() * m) | 0,
            need2 = (Math.random() * m) | 0;
        projects.get( need, function( err, p ){
            k++;
            //console.log(err, p && p.pid);
        } );
        projects2.get( need, function( err, p ){
            k++;
            //console.log(err, p && p.pid);
        } );
        //if(k%1000===0)console.log(k);
    }
    /*if(!projects[need]){
        client.get('project:'+need, function( err, val ){
            if(val!== null){
                projects[need] = JSON.parse(val);
                after(projects[need]);
            }else{
                longGetProject(need, function( err, val ){
                    projects[need] = val;
                    client.hmset('project:'+val.pid,JSON.stringify(val))
                    after(projects[need]);
                });
            }
        });

    }else{
        after(projects[need]);
    }*/
},1);
/*setInterval( function(  ){
    var c = 0;
    client.hgetall('key3', function( err, val ){
        c = val !== null ? val.c : c;
        c=parseInt(c)+1;
        console.log(c);
        client.HMSET('key3', {
            c: c
        });
    });


}, 0)*/
}