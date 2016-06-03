exports = module.exports = function(context){
    var t = context.t, wFactory = context.wFactory;
    return wFactory.build({
        xid: 'projectList',
        content: api.project.list({user:context.user})
    });
};