module.exports = {
    each: function( arr, fn, maxCount, callback, wait ){
        var l = 0, _l = arr.length;

        var nxt = function(  ){
            var nextL = Math.min( l + maxCount, _l );

            fn(arr.slice(l, nextL), l);
            l = nextL;
            if( l < _l )
                setImmediate(nxt,0);
            else
                callback && callback();
        };
        if(wait)
            setImmediate(nxt);
        else
            process.nextTick(nxt);
    }
};