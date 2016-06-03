var costs = Z.pg.use('costs');
/*
costs.add('base', {
    gate: 'terasms',
    service: 'sms',
    type: 'megafon',
    cost: 33,
    createDate: new Date(2014,8,10)
}, function( err, result ){
    console.log(err, result)
});
costs.add('base', {
    gate: 'terasms',
    service: 'sms',
    type: 'megafon',
    cost: 38,
    createDate: new Date(2014,8,12)
}, function( err, result ){
    console.log(err, result)
});
costs.add('project', {
    pid: '75d23a8ed965cb962ca800947a00256c',
    service: 'sms',
    type: 'default',
    cost: 70,
    createDate: new Date(2014,8,12),
    pack: 0
}, function( err, result ){
    console.log(err, result)
});
costs.add('project', {
    pid: '75d23a8ed965cb962ca800947a00256c',
    service: 'sms',
    type: 'beeline',
    cost: 0,
    amount: 666,
    createDate: new Date(2014,8,28),
    pack: 1
}, function( err, result ){
    console.log(err, result)
});
costs.add('project', {
    pid: '75d23a8ed965cb962ca800947a00256c',
    service: 'sms',
    type: 'beeline',
    cost: 69,
    createDate: new Date(2014,8,29),
    pack: 0
}, function( err, result ){
    console.log(err, result)
})
costs.add('project', {
    pid: '75d23a8ed965cb962ca800947a00256c',
    service: 'sms',
    type: 'beeline',
    cost: 0,
    amount: 333,
    createDate: new Date(2014,8,28),
    pack: 1
}, function( err, result ){
    console.log(err, result)
});

costs.add('project', {
    pid: '75d23a8ed965cb962ca800947a00256c',
    service: 'sms',
    type: 'beeline',
    cost: 0,
    amount: 1,
    createDate: new Date(2014,9,3),
    pack: 1
}, function( err, result ){
    console.log(err, result)
});


costs.add('project', {
    pid: '75d23a8ed965cb962ca800947a00256c',
    service: 'sms',
    type: 'default',
    cost: 0,
    amount: 13,
    createDate: new Date(2014,9,5),
    pack: 1
}, function( err, result ){
    console.log(err, result)
});*/
var zoneFn;
var getZone = function (opsos) {
    zoneFn = zoneFn || api.def.getZone.detail.original;
    return zoneFn(opsos) || opsos;
};

var cosher = require('z-redis-cosher');
var baseCosts,
    projectBaseCosts = {},
    projectCosts = new cosher({
        name: 'projectcost',
        idKey: 'id',
        timeout: 60*24,
        connectCfg: App.cfg.redis,
        //actual: +new Date(2015,6,21),
        query: function( pid, cb ){
            costs._low(
                'SELECT  *\n'+//DISTINCT ON (service, type)
                'FROM   project_costs\n' +
                'WHERE pid=$1 AND (pack=$2 OR (pack>$3 and amount > $4))\n'+
                'ORDER  BY service, type, pack, create_date DESC;', [pid,0,0,0],
                function( err, result ){
                    if( err || !result.rows )
                        return cb(null);

                    var data = result.rows
                            .map(
                                costs._makeMapper('project')
                            );

                    //console.log('getCosts', pid, data);
                    //console.log(q);
                    data.unshift({service: 'sms', type: 'default', cost: 110, pack: 0});
                    data.unshift({service: 'smsCode', type: 'default', cost: 150, pack: 0});
                    var hash = {};
                    var packCosts =  {};


                    data.forEach( function( el ){
                        var service = packCosts[el.service] = packCosts[el.service] || {};
                        var type = service[el.type] = service[el.type] || {
                            free: 0
                        };

                        /* implement package logics here */

                        if( el.pack === 1 )
                            type.free += el.amount;


                        if( el.pack === 0 ){
                            var key = el.service + el.type;
                            if( hash[key] ){
                                if( el.createDate > hash[key].createDate || hash[key].createDate == null ){
                                    hash[key] = el;
                                }
                            }else{
                                hash[key] = el;
                            }
                        }
                    });

                    data = [];
                    var el;
                    for( var i in hash )
                        if( hash.hasOwnProperty(i) ){
                            data.push( el = hash[i] );
                            packCosts[el.service][el.type].price = el.cost;
                            packCosts[el.service][el.type].pcid = el.pcid;
                        }

                    projectBaseCosts[pid] = data;
                    cb(
                        packCosts
                    );
                });

    }
});

module.exports = {
    getBase: function( util ){
        if( baseCosts ){
            util.ok(baseCosts);
        }else
            costs._low(
                'SELECT DISTINCT ON (gate, service, type) *\n'+
                'FROM   base_costs\n'+
                'ORDER  BY gate, service, type, create_date DESC;', [],
                function( err, result ){
                    if( err || !result.rows )
                        return util.error();
                    baseCosts = result.rows
                            .map(
                                costs._makeMapper('base')
                            );
                    util.ok(
                        baseCosts
                    );
                }
            );
        return util.wait;
    },
    setCosts: function( util, user, service, type, cost, pack ){


    },
    removePack: function (pid,pcid,user,util) {
        if( user._id !== 'USERNAME' )
            return false;
        costs.remove('project', pcid, function (err) {
            projectCosts.remove(pid);
            util.ok(true);
        });
        return util.wait;
    },
    addPack: function( data, pid, user, util ){
        data = data || {};
        if( user._id !== 'USERNAME' )
            return false;

        var addData;
        data.free = parseInt(data.free) || 0;
        costs.add('project', addData = {
            pid: pid,
            service: data.service || 'sms',
            type: data.type,
            cost: data.price,
            amount: data.free || 0,
            pack: data.free ? 1 : 0,
            createDate: +new Date()
        }, function(err, res){
            projectCosts.remove(pid);
            //console.log(err)
            util.ok(res);
        });
        console.log('addPack',addData);
        return util.wait;
    },
    getCosts: function( util, pid ){
        projectCosts.get(pid, function( err, instance ){
            if( instance ){
                util.ok(instance);
            }else
                util.error('unknown');
        });
        return util.wait;
    },
    calculate: function( pid, service, data, util ){
        data = Z.makeArray(data);
        api.costs.getCosts({pid: pid}, function( result ){
            var sum = 0,
                free = 0,
                hash = Z.clone(result[service], true);
            data.forEach( function( el ){
                el.count < 0 && (el.count = 0);
                var reducePrice = function( prices ){
                    if(prices.free){
                        if( prices.free > el.count ){
                            free += el.count;
                            prices.free -= el.count;
                            el.count = 0;
                        }else{
                            free += prices.free;
                            el.count -= prices.free;
                            prices.free = 0;
                        }
                    }
                };
                //console.dir(hash);

                if( hash[el.type] )
                    reducePrice( hash[el.type] );
                else{
                    var zones = getZone(el.type), zone;
                    if(zones){
                        for(var i = zones.length;i;){
                            zone = zones[--i];
                            if(hash[zone]){
                                el.type = zone;
                                reducePrice( hash[el.type] );
                                break;
                            }
                        }

                    }

                }

                if( hash['default'] )
                    reducePrice( hash['default'] );
                //var s0 = sum;

                sum += ((hash[el.type] && hash[el.type].price) || (hash['default'] && hash['default'].price) || NaN) * el.count;
                //console.log(s0,sum,sum-s0);
            });
            util.ok({price:sum, free: free});
        });
        return util.wait;
    },
    tryTransaction: function (user, pid, service, data, util) {
        var inData = Z.makeArray(data);

        api.costs.calculate({pid: pid, service: service, data: Z.clone(inData,true)}, function( res ){

            if(!res)
                return util.error('wrong');
            var moveMoney = function(  ){
                if( res.price > 0 ){
                    api.project.get({id: pid}, function( project ){
                        api.balance.get( {owner: pid, from: pid}, function( wallet ){
                            var credit = project.credit || 0,
                                money = wallet.amount * 100;

                            if( money + credit < res.price )
                                return util.error( {text: 'notEnoughMoney'} );

                            api.balance.transaction( {
                                minus: project.postPay ? Infinity : (
                                    project.credit ? project.credit : 0
                                ),
                                id: wallet.id,
                                to: 'THEWALLET',
                                amount: res.price / 100,
                                user: {_id: pid},
                                type: 'terasms' // TODO: fix
                            }, function(){
                                util.ok( true );
                            } );
                        } );
                    });
                }else{
                    util.ok(true);
                }
            };
            if( res.free ){ // if there are free sms -> find packs and reduce count
                costs._low(
                        'SELECT *\n' +
                        'FROM   project_costs\n' +
                        'WHERE  pid=$1 AND service=$2 AND pack=$3\n' +
                        'ORDER  BY create_date ASC;', [pid, service,1],
                    function( err, result ){
                        var data = result.rows
                            .map(
                                costs._makeMapper('project')
                            );
                        util.ok( data );
                        var changes = {};
                        data.sort(function(a,b){
                            return a.type==='default'?1:b.type==='default'?-1:0;
                        });

                        for( var j = 0, _j = inData.length; j < _j; j++ ){
                            var inJ = inData[j];
                            if( inJ.count > 0 )
                                for( var i = 0, _i = data.length; i < _i; i++ ){
                                    var item = data[i];

                                    if( item.type === inJ.type || item.type === 'default' ){//TODO real calculate for each original data opsos
                                        var el = changes[item.pcid] = changes[item.pcid] || Z.clone( item );
                                        if( el.amount <= inJ.count ){
                                            inJ.count -= el.amount;
                                            el.amount = 0;
                                        }else{
                                            el.amount -= inJ.count;
                                            inJ.count = 0;
                                            break;
                                        }
                                    }
                                }
                        }
                        // TODO: log operation
                        Z.each(changes, function( k, el ){
                            /*console.log(data.filter(function(a){return a.pcid===el.pcid} ).map( function( el ){
                                return {
                                    type:el.type, service:el.service, amount: el.amount,cost:el.cost
                                };
                            })[0]);
                            console.log(el.amount,'!');*/
                            costs.edit('project', el.pcid, {amount: el.amount});
                        });
                        moveMoney();
                    }
                );
            }else{
                moveMoney();
                // TODO transaction
            }

        });
        return util.wait;
    },
    transaction: function( user, pid, service, data, util ){
        var inData = Z.makeArray(data);

        api.costs.calculate({pid: pid, service: service, data: Z.clone(inData,true)}, function( res ){

            if(!res)
                return util.error('wrong');
            var moveMoney = function(  ){
                if( res.price > 0 ){
                    api.project.get({id: pid}, function( project ){


                        api.balance.get( {owner: pid, from: pid}, function( wallet ){
                            api.balance.transaction( {
                                minus: project.postPay ? Infinity : (
                                    project.credit ? project.credit : 0
                                ),
                                id: wallet.id,
                                to: 'THEWALLET',
                                amount: res.price / 100,
                                user: {_id: pid},
                                type: 'terasms' // TODO: fix
                            }, function(){
                                util.ok( true );
                            } );
                        } );
                    });
                }else{
                    util.ok(true);
                }
            };
            if( res.free ){ // if there are free sms -> find packs and reduce count
                costs._low(
                        'SELECT *\n' +
                        'FROM   project_costs\n' +
                        'WHERE  pid=$1 AND service=$2 AND pack=$3\n' +
                        'ORDER  BY create_date ASC;', [pid, service,1],
                    function( err, result ){
                        var data = result.rows
                            .map(
                                costs._makeMapper('project')
                            );
                        util.ok( data );
                        var changes = {};
                        data.sort(function(a,b){
                            return a.type==='default'?1:b.type==='default'?-1:0;
                        });

                        for( var j = 0, _j = inData.length; j < _j; j++ ){
                            var inJ = inData[j];
                            if( inJ.count > 0 )
                                for( var i = 0, _i = data.length; i < _i; i++ ){
                                    var item = data[i];

                                    if( item.type === inJ.type || item.type === 'default' ){//TODO real calculate for each original data opsos
                                        var el = changes[item.pcid] = changes[item.pcid] || Z.clone( item );
                                        if( el.amount <= inJ.count ){
                                            inJ.count -= el.amount;
                                            el.amount = 0;
                                        }else{
                                            el.amount -= inJ.count;
                                            inJ.count = 0;
                                            break;
                                        }
                                    }
                                }
                        }
                        // TODO: log operation
                        Z.each(changes, function( k, el ){
                            /*console.log(data.filter(function(a){return a.pcid===el.pcid} ).map( function( el ){
                                return {
                                    type:el.type, service:el.service, amount: el.amount,cost:el.cost
                                };
                            })[0]);
                            console.log(el.amount,'!');*/
                            costs.edit('project', el.pcid, {amount: el.amount});
                        });
                        moveMoney();
                    }
                );
            }else{
                moveMoney();
                // TODO transaction
            }

        });
        return util.wait;
    }
};