exports = module.exports = function(context){
    var t = context.t, wFactory = context.wFactory;
    return wFactory.build({
        xid: 'contactList',
        content: api.contactList.list({user:context.user})
    });
};