exports = module.exports = function(context){
    var t = context.t, wFactory = context.wFactory;
    var data = [];
    for(var i = -20; i < 100; i++){
        data.push({date: +new Date()+1000*i, val: Math.random()*150})
    }
    return wFactory.build({
        xid: 'graph',
        content: data
    });
};
