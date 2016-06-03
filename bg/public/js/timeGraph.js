/**
 * Created by Namia on 11.07.14.
 */
(function(  ){
    var G = function( cfg ){
        Z.apply(this, cfg);
        this.init();
    };
    G.prototype = {
        init: function(){
            var c = this.c = document.createElement('canvas');
            c.style.width = '100%';
            c.style.height = '450px';
            c.height = 450;

            this.ctx = c.getContext('2d');
            this.renderTo.appendChild(c);

            setTimeout( function(  ){
                c.width = c.clientWidth;
                this.draw();
            }.bind(this),20);

        },
        analize: function( data ){
            var stat = stat = {minCount: 0, maxDate: +new Date()};
            data.forEach( function( el ){
                if( !stat.minDate || stat.minDate > el.date )
                    stat.minDate = el.date;

                /*if( !stat.maxDate || stat.maxDate < el.date )
                    stat.maxDate = el.date;*/

                if( !stat.maxCount || stat.maxCount < el.count )
                    stat.maxCount = el.count;
            });
            stat.minDate -= 1000*60*60;
            stat.maxCount *= 1.1;
            return stat;
        },
        draw: function(){

            var originData = this.data.slice();
            originData.sort( function( a, b ){
                return a.date- b.date;
            });
            var data = [],
                lastDate,
                step = 1000*60*60,
                sumCount = 0;
            originData.forEach( function(el){
                if( !lastDate || lastDate + step < el.date ){
                    if( lastDate )
                        data.push({date: lastDate, count: sumCount});
                    lastDate = el.date;
                    sumCount = 0;
                }
                sumCount+=el.count;
            });
            lastDate && data.push({date: lastDate, count: sumCount});
console.log(data);
            var ctx = this.ctx;
            var stat = this.analize(data);
            var i,
                minDate = i = stat.minDate, _i = stat.maxDate;
            var offsetX = 40;
            var w = this.c.clientWidth-offsetX,

                h = 400/stat.maxCount;
            var px = w/(_i-i);
            var minW = step*px;
            ctx.lineWidth = 1;
            ctx.fillStyle = "rgb(128,128,208)";
            ctx.strokeStyle = "rgb(128,128,208)";
            ctx.beginPath();
            var offsetX = 30;
            ctx.moveTo(offsetX-0.5,30);
            ctx.lineTo(offsetX-0.5,400);
            ctx.stroke();
            var grepWidth = 3;
            ctx.font="15px Verdana";
            for( var i = 0, _i = stat.maxCount/1.1; i < _i; ){
                i = (i + Math.floor(_i/10));
                if( _i/10<1 )i++;
                if( i > 0 ){
                    ctx.beginPath();
                    ctx.moveTo(offsetX,400-((i*h)|0)+0.5);
                    ctx.lineTo(offsetX+grepWidth,400-((i*h)|0)+0.5);
                    ctx.stroke();
                    var name = (i|0)+'';
                    ctx.fillText(name,offsetX-grepWidth-5-name.length*8,400-i*h+5)
                }
            }


            ctx.beginPath();
            ctx.moveTo(offsetX-0.5,400.5);
            ctx.lineTo(w,400.5);
            ctx.stroke();
            var offsetX = 40;
            ctx.font="10px Verdana";
            var maxDate = stat.maxDate;
            for( var i = minDate, _i = maxDate-(maxDate-minDate)*0.05; i < _i; ){


                if( i > minDate ){
                    ctx.beginPath();
                    var xd = new Date(i);
                    xd.setHours(0,0,0,0);
                    var l1 = offsetX+(+xd-minDate)*px;
                    ctx.moveTo(l1,400.5);
                    ctx.lineTo(l1,400.5+grepWidth);
                    ctx.stroke();

                    var name = dateFormatter(+xd);
                    ctx.fillText(name,l1-name.length*2.5,400.5+grepWidth*4);
                }
                i = (i + Math.floor((maxDate-minDate)/13));
                if( (maxDate-minDate)/13<1 )i++;
            }



            data.forEach( function( el ){
                ctx.beginPath();
                var left = (el.date-minDate)*px;
                ctx.fillRect(offsetX+left,400, minW,-((el.count)*h || 0));
                //ctx.stroke();
            });


        }
    };
    Z.observable(G.prototype);
    widgets.timeGraph = function( cfg ){
        return new G(cfg);
    };

})();