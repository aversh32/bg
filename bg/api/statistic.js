/**
 * Created by Ivan on 11/12/2014.
 */
//var S = Z.pg.use('stats');
var zoneFn;
var getZone = function (opsos) {
    zoneFn = zoneFn || api.def.getZone.detail.original;
    return zoneFn(opsos) || opsos;
};
var B = Z.pg.use('balance');
require('../public/js/lengthCounter');
module.exports = {
    collect: function (seq, iid, type, util, data) {
        debugger;
        return util.wait;
    },
    money: function( util, user, from, to, wallet, pid, uid, group ){
        var where = [],
            data = [], n = 1;
        group = group || 'YYYY-MM';
        data.push(group);
        n++;

        if( from ){
            where.push('t.create_date >= $'+(n++));
            var fromDate = new Date(from);
            fromDate.setHours(0,0,0,0);
            data.push(fromDate);
        }
        if( to ){
            where.push('t.create_date <= $'+(n++));

            var toDate = new Date(to);
            toDate.setHours(0,0,0,0);
            data.push(toDate);
        }
        if( uid === user._id || user._id === 'USERNAME' ){

        }
        if( pid ){
            B.get('wallet', {creator: pid}, function(w){
                wallet = w.wid;
            });
        }
        var q = 'select to_char(t.create_date,$1) as date,w1.creator as from,w2.creator as to,sum(amount) as amount ' +
            'from transaction as t\n' +
            'left join wallet as w1 on (w1.wid = t.from)\n'+
            'left join wallet as w2 on (w2.wid = t.to)\n'+
            (where.length ? ' where '+ where.join(' AND ')+'\n':'')+
            'group by 1, w1.creator, w2.creator';
        console.green(q );
        console.log(data);
        B._low(q, data, function( err, res ){
            util.ok(res.rows);
        });
        return util.wait;
    },
    project: function( util, user, pid, from, to, group ){
        //#can user project.viewBalance in project: pid
        var where = [],
            data = [], n = 1;
        group = group || 'YYYY-MM-DD';
        data.push(group);
        n++;

        if( from ){
            where.push('t.create_date >= $'+(n++));
            data.push(new Date(from));
        }
        if( to ){
            where.push('t.create_date <= $'+(n++));
            data.push(new Date(to));
        }
        if( pid ){
            B.get('wallet', {creator: pid}, function(w){
                var wallet = w.wid;
                where.push('(t.from = $'+(n) + ' OR t.to = $'+(n)+')');
                n++;
                data.push(wallet);
                var d = +new Date();
                var q = 'select to_char(t.create_date,$1) as date,w1.creator as from,w2.creator as to,sum(amount) as amount ' +
                    'from transaction as t\n' +
                    'left join wallet as w1 on (w1.wid = t.from)\n'+
                    'left join wallet as w2 on (w2.wid = t.to)\n'+
                    (where.length ? ' where '+ where.join(' AND ')+'\n':'')+
                    'group by 1, w1.creator, w2.creator';
                B._low(q, data, function( err, res ){
                    console.log('STAT QUERY time: '+ (+new Date()-d));
                    util.ok(res.rows);
                });
            });
        }else{
            return util.error();
        }

        return util.wait;
    },
    detail: function (util, user, pid, from, to, phone) {
        //#can user project.viewBalance in project: pid
        var dates = {},
            templater = api.templater.template.detail.original;
        var pad = function (val) {
            return(val<10?'0'+val:val);
        };
        var where = [],
            data = [], n = 1;
        where.push('pid=$'+(n++));
        data.push(pid);
        if( from ){
            where.push('m.create_date >= $'+(n++));
            var d = new Date(from);
            d.setHours(0,0,0,0);
            data.push(d);
        }
        if( to ){
            where.push('m.create_date < $'+(n++));
            var d = new Date(to);
            d.setHours(0,0,0,0);
            d.setDate(d.getDate()+1);
            data.push(d);
        }

        var q = 'select s.status, s.cid, c.phone, c.json, m.text, m.create_date as "date" from deliveries as d '+
               'left join delivery_msg as m on (d.did = m.did) '+
               'left join delivery_status as s on (s.mid = m.mid) '+
               'LEFT JOIN contacts as c ON (c.cid = s.cid::bigint) '+
               'where '+where.join(' AND ')+';';
        console.log(q,data);
        var counts = {},
            sumSegments = 0,
            c = 0;
        var result = '';
        B._low(q, data,
            function (row) {

                var d = row.date;
                if(!d)
                    return;
                var p = row.phone || row.cid;

                var obj = {phone: p, date: d.getFullYear()+'-'+ pad(d.getMonth()+1)+'-'+ pad(d.getDate())+' '+ d.getHours()+':'+pad(d.getMinutes())},
                    text = row.text;
                if(!obj.phone || !text)
                    return;
                if(text.indexOf('{')>-1 && text.indexOf('}')>-1){
                    row.json && row.json !== '{}' && Z.apply(obj, JSON.parse(row.json));
                    text = templater( text, obj );
                }
                obj.count = smsLength( text )[0];
                sumSegments += obj.count;
                c++;
                result+='<tr>' +
                    '<td>'+c+'</td>' +
                    '<td>'+obj.count+'</td>' +
                    '<td>'+sumSegments+'</td>' +
                    '<td>'+obj.phone+'</td>' +
                    '<td>'+obj.date+'</td>' +
                    '<td>'+text+'</td>' +
                '</tr>';
            }, function () {
                result = '<table border="1">' +
                    '<tr>' +
                        '<td class="op">№</td>' +
                        '<td>Segment count</td>' +
                        '<td>Segment total</td>' +
                        '<td>To</td>' +
                        '<td>Date</td>' +
                        '<td>Text</td>' +
                    '</tr>'+
                    result+
                '</table>';

                util.addHeader({'Content-Type': 'text/html'});
                util.stringify = function( data ){
                    return '<html><head><meta content="text/html; charset=utf-8" http-equiv="Content-Type"></head>' +
                        '<body>'+result+'</body></html>';
                };
                return util.ok();
            }
        );
        return util.wait;
    },
    lengthsData: function (util, user, pid, from, to) {
        var dates = {},
            templater = api.templater.template.detail.original;
        var pad = function (val) {
            return(val<10?'0'+val:val);
        };
        var where = [],
            data = [], n = 1;
        where.push('pid=$'+(n++));
        data.push(pid);
        if( from ){
            where.push('m.create_date >= $'+(n++));
            var d = new Date(from);
            d.setHours(0,0,0,0);
            data.push(d);
        }
        if( to ){
            where.push('m.create_date < $'+(n++));
            var d = new Date(to);
            d.setHours(0,0,0,0);
            d.setDate(d.getDate()+1);
            data.push(d);
        }

        var q = 'select s.status, s.cid, c.phone, c.json, m.text, m.create_date as "date" from deliveries as d '+
               'left join delivery_msg as m on (d.did = m.did) '+
               'left join delivery_status as s on (s.mid = m.mid) '+
               'LEFT JOIN contacts as c ON (c.cid = s.cid::bigint) '+
               'where '+where.join(' AND ')+';';
        console.log(q,data);
        var counts = {};
        B._low(q, data,
            function (row) {

                var d = row.date;
                if(!d)
                    return;
                var p = row.phone || row.cid;

                var obj = {phone: p, date: d.getFullYear()+'-'+ pad(d.getMonth()+1)+ pad(d.getDate())},
                    text = row.text;
                if(!obj.phone || !text)
                    return;
                if(text.indexOf('{')>-1 && text.indexOf('}')>-1){
                    row.json && row.json !== '{}' && Z.apply(obj, JSON.parse(row.json));
                    text = templater( text, obj );
                }
                obj.count = smsLength( text )[0];
                if(obj.count>1)
                    (counts[obj.count] = counts[obj.count] || []).push({phone:obj.phone, text: text});
            }, function () {
                return util.ok(counts);
            }
        );
        return util.wait;

    },
    reportData: function (util, user, pid, from, to, mid, phone, group) {
        var dates = {},
            templater = api.templater.template.detail.original;
        group = group || 'day';
        var resolveFn = api.def.info.detail.original;
        var getOpsos = function( phone ){
            return resolveFn(phone).op;
        };
        var pad = function (val) {
            return(val<10?'0'+val:val);

        };
        var where = [],
            data = [], n = 1;
        if(pid) {
            where.push('pid=$' + (n++));
            data.push(pid);
        }
        if( from ){
            where.push('m.create_date >= $'+(n++));
            var d = new Date(from);
            d.setHours(0,0,0,0);
            data.push(d);
        }
        if( to ){
            where.push('m.create_date < $'+(n++));
            var d = new Date(to);
            d.setHours(0,0,0,0);
            d.setDate(d.getDate()+1);
            data.push(d);
        }
        if( mid ){
            where.push('m.mid = ANY($'+(n++)+'::bigint[])');
            data.push(mid);
        }
        var phoneFilter = false;
        if(phone){
            phoneFilter = Z.a2o(Z.isArray(phone)?phone:[phone]);
        }
        var q = 'select s.status, s.cid, c.phone, c.json, m.text, m.create_date as "date" from deliveries as d '+
               'left join delivery_msg as m on (d.did = m.did) '+
               'left join delivery_status as s on (s.mid = m.mid) '+
               'LEFT JOIN contacts as c ON (c.cid = s.cid::bigint) '+
                (where.length ? 'where '+where.join(' AND ') : '')+
            ';';
        console.log(q,data);
        api.costs.getCosts({user:user,pid:pid}, function (prices) {
            prices = prices.sms;


            B._low(q, data,
                function (row) {

                    var d = row.date;
                    if(!d)
                        return;
                    var p = row.phone || row.cid;

                    if(phoneFilter && !(p in phoneFilter))
                        return;
                    var obj = {phone: p, date: d.getFullYear()+'-'+ pad(d.getMonth()+1)+(group==='day'?'-'+ pad(d.getDate()):'')},
                        text = row.text;
                    if(!obj.phone || !text)
                        return;
                    if(text.indexOf('{')>-1 && text.indexOf('}')>-1){
                        row.json && row.json !== '{}' && Z.apply(obj, JSON.parse(row.json));
                        text = templater( text, obj );
                    }
                    obj.count = smsLength( text )[0];
                    (dates[obj.date] || (dates[obj.date] = [])).push(obj);

                }, function () {
                    var c = api.def.getCountries.detail.original();
                    var ds = [];
                    var opps = {}, j = 0;
                    var opHash = Z.makeHash(api.def.list.detail.original(),'id');
                    Z.map(dates, function (date, d) {
                        ds.push(date);
                        var errors = 0;
                        //console.log(date, d.length);

                        var mapped = Z.map(d.reduce(function (a, phone) {

                            if (phone) {
                                var res = resolveFn(phone.phone);
                                if (!res) {
                                    errors++;
                                    /*op = phone;
                                     a[op] = (a[op] || 0) + 1;*/
                                } else {
                                    var op = res.op;
                                    a[op] = (a[op] || 0) + (phone.count||1);
                                }
                            }
                            return a;
                        }, {}), function (k, v) {


                            k === 'undefined' && (k = 'Unknown');

                            (opps[k] || (opps[k] = []))[j] = v;


                            return k + ': ' + v;
                        }).sort(function (a, b) {
                            var n1 = a.split(': ')[0] in c,
                                n2 = b.split(': ')[0] in c;

                            var n3 = a.split(': ')[1],
                                n4 = b.split(': ')[1];
                            return n2 > n1 ? -1 : n2 < n1 ? 1 : n4 - n3;
                        }).join('\n');
                        //console.log('Странные номера: ',errors);
                        //console.log(mapped)
                        j++;
                        return mapped;
                    });
                    var sd = ds.slice().sort(),
                        sdHash = {};

                    sd.forEach(function (el,i) {
                        sdHash[el] = ds.indexOf(el);
                    });

                    var sumDate = {}, theSum = 0;
                    var out = {
                        dates: sd,
                        sums: []
                    };
                    var interm = Z.map(opps, function (op, v) {
                        var j = (opHash[op]||{name:op, id: op});
                            return {op: j.id, v: v, name: j.name}
                        }).sort(function (a, b) {
                            var n1 = a.op in c,
                                n2 = b.op in c;

                            return n2 > n1 ? -1 : n2 < n1 ? 1 : 0;
                        }).map(function (el) {
                            //console.log(prices);
                            var sum = 0;
                            var dat = [];
                            var p = prices[el.op];
                            var defaultPrice,
                                zoneName = false;
                            if(p){
                                var price = p.price;
                                defaultPrice = false;
                            }else{
                                price = prices['default'].price;
                                defaultPrice = true;
                                var zones = getZone(el.op), zone;
                                if(zones){
                                    for(var i = zones.length;i;){
                                        zone = zones[--i];
                                        if(prices[zone]){
                                            defaultPrice = false;
                                            price = prices[zone].price;
                                            zoneName = zone;
                                            break;
                                        }
                                    }

                                }
                            }


                            var o = {
                                id: el.op,
                                name: el.name,
                                days: dat,
                                defaultPrice: defaultPrice,
                                price: price,
                                zoneName: zoneName
                            };
                        //console.log(o);
                            for(var i = 0, _i = sd.length; i < _i; i++){
                                var d = sd[i];
                                var val = el.v[sdHash[d]];
                                sum+=(val|0);
                                sumDate[d] = (sumDate[d]|0)+(val|0);
                                dat.push(val);
                            }
                            o.sum = sum;

                            return o;
                        });
                    var d1 = [], zond = {}, z;
                    for(var i = 0, _i = interm.length; i < _i;i++){
                        var it = interm[i];
                        if(!it.zoneName)
                            d1.push(it);
                        else{
                            if(z=zond[it.zoneName]){
                                z.sum=(z.sum||0)+(it.sum||0);
                                for(var j = it.days.length;j;) {
                                    j--;
                                    z.days[j]=(z.days[j]||0)+(it.days[j]||0);
                                }
                            } else {
                                zond[it.zoneName] = it;
                                it.id = it.name = it.zoneName;
                            }
                        }
                    }
                    out.data = Z.map(zond, function (k,v) {
                        return v;
                    }).concat(d1);

                    sd.forEach(function(el,i){
                        out.sums[i]=sumDate[el];
                        theSum += sumDate[el];
                    });
                    out.sum = theSum;
                    util.ok(out);
                });
            });/*
            function (row) {
                console.log(row)
            }, function () {
                console.log('done');
            });
            */
        return util.wait;
    },

    report: function (util, user, pid, from, to, mid, phone, group) {
        //#can user project.viewBalance in project: pid
        api.statistic.reportData({
            user:user,
            pid:pid,
            from:from,
            to:to,
            mid:mid,
            phone:phone,
            group:group}, function (data) {
                var sd = data.dates;
                var result = '<table border="1"><tr><td class="op">Оператор</td><td class="sum">Всего</td><td class="price">Цена (коп)</td><td class="final">Итог (руб)</td><td>'+ sd.join('</td><td>')+'</td></tr>'+
                    data.data.map(function (el) {
                        return '<tr class="'+(el.defaultPrice?'defPrice':'')+'"><td class="op">'+el.name+'</td>'+
                                '<td class="sum">'+ el.sum +'</td><td class="price"><input value="'+el.price+'"></td><td class="final"></td><td>'+el.days.join('</td><td>')+'</td></tr>';
                    }).join('')+
                '<tr class="bottom"><td>Сумма</td><td class="sum">'+data.sum+'</td><td class="price"></td><td class="final" id="total"></td><td>'+
                    data.sums.join('</td><td>')+'</td></tr>'+
                '</table>';
                util.response.header('Content-Type','text/html');
                util.stringify = function( data ){
                    return '<html><head><meta charset="utf-8"><style>' +
                        '.defPrice {background:#f65} .bottom {text-align: right;background: #aed;} input{background: transparent;border: 0;width: 5em;} * {font-family: tahoma;font-size:10px} .op {background:#eee} .sum {background: #aed} .price {background: #ade} .final {background: #cad}' +
                        '</style></head><body>'+data.data+'<script>' +
    'var inputs = Array.prototype.slice.call(document.querySelectorAll(\'input\')).map(function(el){'+
    '  return {el:el, count: el.parentNode.previousElementSibling.innerHTML|0, result: el.parentNode.nextElementSibling}'+
    '}), change = function(){'+
    '  this.sum = this.result.innerHTML = this.count*this.el.value/100;'+
    '  document.getElementById(\'total\').innerHTML = (inputs.reduce(function(a,b){return a + (b.sum||0)},0)).toFixed(2);'+
    '};'+
    'inputs.forEach(function(item){var input=item.el, fn = input.onchange = input.onkeyup = change.bind(item); fn()})'+
                    '</script></body></html>';
                };
                util.ok(result);

        });
        return util.wait;
    },
    dashboard: function (user, util) {
        B._low(
            'select count(*) from delivery_status as s ' +
            'left join delivery_msg as m on(m.mid = s.mid) ' +
            'where s.status in (0,1);', [], function (row) {

            }
        )
    }
};