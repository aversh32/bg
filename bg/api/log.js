/**
 * Created by Ivan on 9/9/2014.
 */
var log = Z.pg.use('log');
exports = module.exports = {
    get: function( offset, user,uid, util ){
        if( user._id==='USERNAME' ){
            var where = [], x = 1, data = [];
            if( uid ){
                where.push( 'a.u = $'+(x++));
                data.push(uid);
            }
            if( offset > 0 ){
                where.push( 'a.eid<($'+(x++)+')');
                data.push(offset+29);
            }

            log._low('SELECT a.*,b.data as r\n' +
                    'FROM   apilog a\n' +
                    'LEFT JOIN apianswer b on (b.eid=a.eid)\n'+
                    (where.length ? 'WHERE '+where.join(' AND ') +'\n' : '')+
                    //(offset > 0 ? 'WHERE  a.eid<($1)\n' : '') +
                    'ORDER  BY a.eid DESC\n' +
                    'LIMIT 30;', data,
                function( err, result ){
                    if( err ){
                        util.error(err);
                    }else
                        util.ok(result.rows);
            })
        }
        return util.wait;
    },
    write: function (data) {
        console.log('LOG.write: ', data);
    }
};