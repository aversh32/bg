exports = module.exports = function(context){
    var t = context.t, wFactory = context.wFactory;

    return wFactory.build({
        xid: 'stats',
        content: api.project.list({user:context.user})
    });
};
