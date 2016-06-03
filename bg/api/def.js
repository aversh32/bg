/**
 * Created by Ivan on 4/17/2015.
 */
(function () {


    var c = {
        'Abkhazia': 7,
        'Afghanistan': 93,
        'Albania': 355,
        'Algeria': 213,
        'American Samoa': 1684,
        'Andorra': 376,
        'Angola': 244,
        'Anguilla': 1264,
        'Antigua and Barbuda': 1268,
        'Argentina': 54,
        'Armenia': 374,
        'Aruba': 297,
        'Australia': 61,
        'Austria': 43,
        'Azerbaijan': 994,
        'Bahamas': 1242,
        'Bahrain': 973,
        'Bangladesh': 880,
        'Barbados': 1246,
        'Belarus': 375,
        'Belgium': 32,
        'Belize': 501,
        'Benin': 229,
        'Bermuda': 1441,
        'Bhutan': 975,
        'Bolivia': 591,
        'Bosnia and Herzegovina': 387,
        'Botswana': 267,
        'Brazil': 55,
        'Brunei Darussalam': 673,
        'Bulgaria': 359,
        'Burkina Faso': 226,
        'Burundi': 257,
        'Cambodia': 855,
        'Cameroon': 237,
        'Canada': 1,
        'Cape Verde': 238,
        'Cayman Islands': 1345,
        'Central African Republic': 236,
        'Chad': 235,
        'Chile': 56,
        'China': 86,
        'Colombia': 57,
        'Comoros': 269,
        'Congo': 242,
        'Congo, Democratic Republic of': 243,
        'Cook Islands': 682,
        'Costa Rica': 506,
        'Cote d\'Ivoire': 225,
        'Croatia': 385,
        'Cuba': 53,
        'Cyprus': 357,
        'Czech Republic': 420,
        'Denmark': 45,
        'Djibouti, Republic of': 253,
        'Dominica, Commonwealth of': 1767,
        'Dominican Republic': 1,
        'Ecuador': 593,
        'Egypt': 20,
        'El Salvador': 503,
        'Equatorial Guinea': 240,
        'Estonia': 372,
        'Ethiopia': 251,
        'Falkland Islands': 500,
        'Faroe Islands': 298,
        'Fiji': 679,
        'Finland': 358,
        'France': 33,
        'French Guiana': 594,
        'French Polynesia': 689,
        'Gabon': 241,
        'Gambia': 220,
        'Georgia': 995,
        'Germany': 49,
        'Ghana': 233,
        'Gibraltar': 350,
        'Greece': 30,
        'Greenland': 299,
        'Grenada': 1473,
        'Guadeloupe': 590,
        'Guam': 1671,
        'Guatemala': 502,
        'Guernsey': 44,
        'Guinea': 224,
        'Guinea-Bissau': 245,
        'Guyana': 592,
        'Haiti': 509,
        'Honduras': 504,
        'Hong Kong': 852,
        'Hungary': 36,
        'Iceland': 354,
        'India': 91,
        'Indonesia': 62,
        'Iran': 98,
        'Iraq': 964,
        'Ireland': 353,
        'Isle of Man': 44,
        'Israel': 972,
        'Italy': 39,
        'Jamaica': 1876,
        'Japan': 81,
        'Jersey': 44,
        'Jordan': 962,
        'Kazakhstan': 7,
        'Kenya': 254,
        'Korea, Republic of': 82,
        'Kuwait': 965,
        'Kyrgyzstan': 996,
        'Laos': 856,
        'Latvia': 371,
        'Lebanon': 961,
        'Lesotho': 266,
        'Liberia': 231,
        'Libya': 218,
        'Liechtenstein': 423,
        'Lithuania': 370,
        'Luxembourg': 352,
        'Macau': 853,
        'Macedonia': 389,
        'Madagascar': 261,
        'Malawi': 265,
        'Malaysia': 60,
        'Maldives': 960,
        'Mali': 223,
        'Malta': 356,
        'Martinique': 596,
        'Mauritania': 222,
        'Mauritius': 230,
        'Mexico': 52,
        'Moldova': 373,
        'Monaco': 377,
        'Mongolia': 976,
        'Montenegro': 382,
        'Montserrat': 1664,
        'Morocco': 212,
        'Mozambique': 258,
        'Myanmar': 95,
        'Namibia': 264,
        'Nauru': 674,
        'Nepal': 977,
        'Netherlands': 31,
        'Netherlands Antilles': 599,
        'New Caledonia': 687,
        'New Zealand': 64,
        'Nicaragua': 505,
        'Niger': 227,
        'Nigeria': 234,
        'Norfolk Island': 672,
        'Northern Mariana Islands': 1670,
        'Norway': 47,
        'Oman': 968,
        'Pakistan': 92,
        'Palau': 680,
        'Palestinian Territory': 970,
        'Panama': 507,
        'Papua New Guinea': 675,
        'Paraguay': 595,
        'Peru': 51,
        'Philippines': 63,
        'Poland': 48,
        'Portugal': 351,
        'Puerto Rico': 1,
        'Qatar': 974,
        'Reunion': 262,
        'Romania': 40,
        'Russian Federation': 7,
        'Rwanda, Republic of': 250,
        'Saint Kitts and Nevis': 1869,
        'Saint Lucia': 1758,
        'Saint Vincent and The Grenadines': 1784,
        'Samoa': 685,
        'San Marino, Republic of': 378,
        'Sao Tome and Principe': 239,
        'Saudi Arabia': 966,
        'Senegal': 221,
        'Serbia': 381,
        'Seychelles': 248,
        'Sierra Leone': 232,
        'Singapore': 65,
        'Sint Maarten': 1721,
        'Slovakia': 421,
        'Slovenia': 386,
        'Solomon Islands': 677,
        'Somalia': 252,
        'South Africa': 27,
        'South Ossetia': 7,
        'South Sudan': 211,
        'Spain': 34,
        'Sri Lanka': 94,
        'Sudan': 249,
        'Suriname': 597,
        'Swaziland': 268,
        'Sweden': 46,
        'Switzerland': 41,
        'Syria': 963,
        'Taiwan': 886,
        'Tajikistan': 992,
        'Tanzania': 255,
        'Thailand': 66,
        'Timor L\'este': 670,
        'Togo': 228,
        'Tonga': 676,
        'Trinidad and Tobago': 1868,
        'Tunisia': 216,
        'Turkey': 90,
        'Turkmenistan': 993,
        'Turks and Caicos Islands': 1649,
        'Uganda': 256,
        'Ukraine': 380,
        'United Arab Emirates': 971,
        'United Kingdom': 44,
        'United States': 1,
        'Uruguay': 598,
        'Uzbekistan': 998,
        'Vanuatu': 678,
        'Venezuela': 58,
        'Vietnam': 84,
        'Virgin Islands, British': 1284,
        'Virgin Islands, U.S.': 1340,
        'Yemen': 967,
        'Zambia': 260,
        'Zimbabwe': 263
    };
    var TreeTextHash = function (el, val, key) {
        var f = new Function('el',
            'var val, key,index,' +
            'hash = this.hash = {},i,_i,m,root;' +
            'for( key in el ){' +
            'val = el[key];' +
            'index = ' + val + '+\'\';' +
            'root=hash;' +
            'for(i=0,_i=index.length;i<_i;i++){' +
            'm=index.charAt(i);' +

            'if( i === _i - 1 ){' +
            'root = root[m] = root[m] || {};' +
            'root.val = root.val || [];' +
            'root.val.push(' + key + ');' +
            '}else{' +
            'root = root[m] = root[m] || {};' +
            '}' +

            '' +
            '}' +
            '' +
            '}');
        f.call(this, el)
        //console.dir(this.hash)
        //console.log(this.hash[1].val)
    };
    TreeTextHash.prototype = {
        find: function (phone) {
            phone += '';
            var i, _i, m, hash = this.hash, root = hash, lastVal, item,
                lastPart;
            for (i = 0, _i = phone.length; i < _i; i++) {
                m = phone.charAt(i);
                if (root[m]) {
                    root = root[m];
                    root.val && (lastVal = root.val);
                } else {
                    var i0 = i;
                    i++;
                    if (root.data) {
                        root = root.data;
                        for (; i < _i; i++) {
                            m = phone.substr(i0, i - i0)
                            if (root[m]) {
                                i0 = i;
                                root = root[m];
                                root.val && (lastVal = root.val);
                                break;
                            }
                        }

                        if (_i = root.length) {

                            lastPart = phone.substr(i0);

                            for (i = 0; i < _i; i++) {
                                item = root[i];
                                if (lastPart >= item.from && lastPart <= item.to) {
                                    return {
                                        phone: phone,
                                        last: lastPart,
                                        country: lastVal,
                                        op: item.op,
                                        where: item.where
                                    };
                                    //yaaaz
                                }
                            }
                        }
                    }
                    //console.log(phone.substr(i0), lastVal);
                    return lastVal ? {
                        country: lastVal,
                        phone: phone
                    } : false;
                }

            }
        }
    };
    var th = new TreeTextHash(c, 'val', 'key');

    var d = +new Date();
    var fs = require('fs'),
        cache,
        country = {
            7: 0
        },
        ops = {};
    /*
     700	Dalacom CDMA
     701	Kcell GSM
     702	KCell GSM
     705	Beeline GSM
     707	Neo Telecom GSM
     777	Beeline GSM*/
    var mapping = {
            'Мобильные ТелеСистемы': 'mts',
            'МобильныеТелеСистемы': 'mts',
            'Вымпел-Коммуникации': 'beeline',
            'МегаФон': 'megafon'
        },
        mapping2 = [
            'ЭЕЛ-Рустелком',
            'ДОЗОР',
            'Радиоимпульс',
            'Смольного',
            'Интерком',
            'транковые',
            'компьютерная',
            'Императив',
            'Морсвязь',
            'Примор',
            'Транстк',
            'Глобалстар',
            'Элемтэ',
            'Арктик',
            'Транстелеком',
            'Транзиттелеком',
            'Средневолжская',
            'ЭЕЛ-Рус',
            'Спутниковые',
            'Курганский',
            'Тывасвязь',
            'Содействие',
            'Новгородские',
            'Саратовская',
            'Архангель',
            'Калининград',
            'Алтайская',
            'Открытая',
            'Центральный',
            'Траловый'

        ];
    var getShortName = function (el) {
        var orig = el;
        el = el.replace(/["'`]/g,'');
        mapping2.forEach(function (name) {
            el.toLowerCase().indexOf(name.toLowerCase()) > -1 && (el = name);
        });
        if (el.length > 12)
            el = el
                .replace(/\(|\)/g, '')
                .replace('СервисПартнер', 'ServPartner')
                .replace('Сургутнефтегаз', 'SurgutOilGas')
                .replace('Средневолжская', 'СреднВолж')
                .replace('информационные системы', 'ис')
                .replace('информационные технологии', 'ит')
                .replace('сотовая радиотелефонная связь', 'срс')
                .replace(/Северо-(вост\.|восточные)/gi, 'ne')
                .replace(/(мобильная|мобильные|сотовая|сот|сот.) (связь|сети)/i, '')
                .replace('городская телефонная сеть', 'гтс')
                .replace('городская', 'г')
                .replace(/Деловая Сеть/i, 'дс')
                .replace(/телефонная (сеть|связь)/i, 'тс')
                .replace(/телекоммуникации/i, 'ткм')
                .replace(/телеком/i, 'тк')
                .replace(/вестком/i, 'вк')
                .replace(/(mobile|мобайл|мобильная|сотовая|сот|сот|Коммьюникешенс)\.?/i, '')
                .replace(/лтд\.?/i, '')
                .replace('развитию и использованию навигационных технологий', 'рит')
                .replace(/ЕКАТЕРИНБУРГ/i, 'екб')
                .replace(/Санкт-Петербург|С-Петербургский/i, 'спб')
                .replace(/мурманская/i, 'мур')
                .replace(/волгоград/i, 'волг')
                .replace(/Ярославль/i, 'яр')
                .replace(/казань/i, 'kz')
                .replace(/самара/i, 'sm')
                .replace(/Беспроводные/i, 'wl')
                .replace(/Навигационно/i, 'nav')
                .replace(/иваново/i, 'ив')
                .replace(/холдинг/i, '')
                .replace(/чебоксары/i, 'чб')
                .replace(/Мордовия/i, 'мор')
                .replace(/новогородские/i, 'нов')
                .replace(/Электросвязь/i, 'эс')
                .replace(/Астрахань/i, 'астр')
                .replace(/Московская/i, 'мск')
                .replace(/Башкортостана/i, 'башкор')
                .replace(/(межрегиональный|межрегиональная|межрегиональные)/i, 'crgn')
                .replace(/(региональный|регионе|регионы|регион)\.?/i, 'rgn')
                .replace(/Персональные Системы Связи/i, 'псс')
                .replace(/Ингушетии/i, 'Ингуш')
                .replace(/технический/i, 'тех')
                .replace(/Центр/i, 'Ц')
                .replace(/Ц тк/i, 'ЦТК')
                .replace(' - ', '-')
                .replace(/^-/, '')
                .replace(/-$/, '')
                .replace(/\s\s/, ' ')
                .trim();

        mapping2.forEach(function (name) {
            el.toLowerCase().indexOf(name.toLowerCase()) > -1 && (el = name);
        });
        mapping[el] && (el = mapping[el]);
//	if(el.name.length >12)
//		console.log(el.name,"|", orig);

        return el.length < 13 ? el : (el.substr(0, 6) + el.substr(12, 6)).trim();
    };

    var opName = {};
    var load = function (place, name) {
            var file = fs.readFileSync(name).toString(),
                out = place, token,
                short;
            file = file.split('\n');
            for (var i = 1, _i = file.length; i < _i; i++) {
                token = file[i].split(';');
                if (token.length > 4) {
                    token[0] = token[0].substr(1);
                    short = token[4];
                    short = opName[short] = opName[short] || getShortName(short);
                    (out[token[0]] = out[token[0]] || [])
                        .push({from: token[1], to: token[2], op: short, where: token[5]});

                    if(ops[short])
                        ops[short].c += token[3]-0;
                    else
                        ops[short] = {c: token[3]-0, name: token[4], id: short};
                }

            }
        },
        find = function (phone) {
            var code = phone.substr(0, 3),
                place = cache[code] || [],
                other = phone.substr(3), i,
                item;
            for (i = place.length; i;) {
                item = place[--i];
                if (item.from <= other && item.to >= other) {
                    return {
                        phone: phone,
                        op: item.op,
                        where: item.where
                    }
                }
            }
            return false;

        };
    th.hash[7][9] = {val: ['Russian Federation']};
    load(th.hash[7][9].data = {}, App.base+ '/def/79.csv');
    c.Kazahstan = 77;
    Z.each(c,
        function (val, key) {
            key+='';
            var root = th.hash, m;
            for(var i = 0, _i = key.length; i < _i; i++){
                m = key.substr(i, 1);
                root = root[m] = root[m] || {}
            }
            var name = val;
            val = getShortName(val);
            root.val = [val];
            root.data = [{
                from:'0',
                to: 'A',
                op: val,
                where: val
            }];
            ops[val] = {id: val, name:name, count:0, country:1};
        });
    th.hash[7][9].data[40] = [{
        from:'0',
        to: 'A',
        op: 'Abkhazia',
        where: 'Abkhazia',
        country:1
    }];
    ops['Abkhazia'] = {id: 'Abkhazia', name:'Abkhazia',count:0, country:1};

    var operators = [];
    for( var i in ops ){
        operators.push({id: i, name: ops[i].name, count: ops[i].c, country: ops[i].country});
    }
    operators.sort(function(a,b){return b.count-a.count});
    var list = operators;
    //console.log('333');
    var zones = [],
        zonesFrom = {},
        zonesTo = {};
    var cosher = require('z-redis-cosher');

    var sync = new cosher.sync({
        connectCfg: App.cfg.redis,
        name:'test1',
        query: function (cb) {
            console.log('query', this.uid);
            setTimeout(function () {
                var arr = [];
                for(var i = Math.random()*10;i>0;i--)arr.push(i);
                console.log('qured!', arr.length, sync.uid)
                cb(arr);
            }, 10);
        },
        change: function (data) {
            console.log('!!!change', this.uid, data.length);
        }
    });

    var sync = new cosher.sync({
        name: 'zonesupdate',
        connectCfg: App.cfg.redis,
        query: function (cb) {
            var zonesInner = [];
            var zonesFromInner = {};
            var zonesToInner = {};
            db._low('select * from zone;', [], function (err, res) {
                //console.log('queried', rr);
                if (err)
                    return console.logModule('def', 'error', err, res);

                zonesInner = res.rows;
                zonesInner.forEach(function (zone) {
                    var from = zone.from,
                        to = zone.to;
                    (zonesFromInner[from] || (zonesFromInner[from] = [])).push(to);
                    (zonesToInner[to] || (zonesToInner[to] = [])).push(from);
                });

                cb({zones:zonesInner,zonesTo:zonesToInner,zonesFrom:zonesFromInner});
            });
        },
        change: function (all) {
            zones = all.zones;
            zonesTo = all.zonesTo;
            zonesFrom = all.zonesFrom;
        }
    });

    var db = Z.pg.use('def', function () {
        sync.init();
    });

    var fs = require('fs');
    /*fs.writeFile("ops.json", JSON.stringify(cache, null, 2), function(err) {
        if(err) {
            return console.log(err);
        }

        console.log("The file was saved!");
    });*/
    exports = module.exports = {
        getCountries: function () {
            return c;
        },
        info: function (phone) {
            /*
            Определение оператора и страны по номеру телефона
            #in#
                phone: phone || Array(phones) - номер или номера телефона
            #ok
                {phone: phone, op: operator, country: array of countries}
             */
            return Z.isArray(phone)?phone.map(th.find.bind(th)):th.find(phone);
        },
        list: function () {
            var opMap = function (v) {
                return ops[v]
            };
            return list.concat(Z.map(zonesTo, function (k, v) {
                return {id: k, zone: 1, count: v.length, name: k, val: v.map(opMap)};
            }));
        },
        zone: function (user, id, val, action, util) {
            //console.log('zone q', action, rr)
            if( user._id === 'USERNAME' ){
                if(action === 'add') {
                    if(!zonesTo[id] || zonesTo[id].indexOf(val)==-1) {
                        db.add('zone', {to: id, from: val}, function (err, val) {
                            console.log('add', err, val, id);
                            sync.changed();
                            util.ok(true);
                        });
                    }else{
                        util.error('exists');
                    }
                }else if( action === 'remove' ){
                    db._low('DELETE from zone WHERE "to"=$1 and "from"=$2;',[id, val], function (err,val) {
                        console.log('remove',err, val, id);
                        sync.changed();
                        util.ok(val && val.rowCount)
                    });
                }else if(action === 'rename'){
                    db._low('UPDATE zone set "to"=$1 where "to"=$2;',[val, id], function (err, val) {
                        console.log('rename',err, val, id);
                        sync.changed();
                        util.ok(val && val.rowCount)
                    });
                }
            }else{
                return util.error('access');
            }
            return util.wait;
        },
        getZone: function (opsos) {
            if(zonesFrom[opsos])
                return zonesFrom[opsos];
            return false;
        }
    };
})();

/*console.log(th.find('79560008299'));//hash[7][916]);
console.log(th.find('79560011199'));

var d = +new Date();
for(var i = 0; i < 1000000; i++){
	(th.find('79164819441'));
	(th.find('79560008299'));
}
console.log(+new Date()-d,'!');
console.log(th.find('16464536649'));*/
/*var operators = [];
for( i in ops ){
	operators.push({name:i, count: ops[i]});
}
operators.sort(function(a,b){return b.count-a.count});*/

/*console.log(list)
console.log(operators);
console.log(operators.length);*/
/*var l = Object.keys(list.reduce(function(a,b){a[b] = 1; return a;},{}));
console.log(l.length);
console.log(l.length === operators.length);*/
//console.log(find('7026460887'));

