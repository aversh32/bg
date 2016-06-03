(function(  ){
    exports = module.exports = {
        user: function( uid, data, user, util ){
            // can user notify.user in user: uid
        },
        project: function(pid, type, data){
            //Z.MQ.send('io:'+pid, {type: type, data: data});
        }
    };
})();