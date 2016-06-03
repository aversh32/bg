var Memcache = function( cfg ){
    this.lifetime = cfg.lifetime;
    this._hash = {};
    this._write = {};
    this._erase = {};
    this._on = {};
};
Memcache.prototype = {
    set: function( k, v ){
        var lifetime;
        this._hash[k] = v;
        
        if( lifetime = this.lifetime ){
            var d = +(new Date()),
                tick = (d+lifetime);
            this._write[k] = {date: d, erase: tick};
            (this._erase[ tick ] = this._erase[ tick ] || []).push(k);
            !this._timeout && (this._timeout = setTimeout(this._eraser.bind(this), lifetime));
        }
    },
    _eraser: function(){
        var d = +(new Date()),
            lifetime = this.lifetime,
            erase = this._erase,
            hash = this._hash,
            seq;
        for( var i in erase )
            if( parseInt(i) <= d ){
                while( seq = erase.pop() )
                    delete hash[seq];
                delete erase[i];
            }
        console.log(this._erase, d )
        
    },
    get: function( k, callback ){
        var hash = this._hash,
            data;
        if( k in hash )
            callback && callback( data = hash[k] );
        else{
            var on = this._on;
        
            if( on[k] )
                on[k].push(callback);
            else
                on[k] = [callback];
                
        }
            
        return data;
    }
};
/*
var x = new Memcache({
    lifetime: 1000
});
x.set(1,{a:1,b:2})
x.set(2,{a:1,b:2})

for(var n = 0; n < 3000; n+=300)
setTimeout(function(){
    x.get(2, function(data){
        console.log(data);
    });
},n)*/
