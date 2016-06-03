// last upd 13.03.2014 by ymatuhin (ymatuhin@yandex.ru)

$.fn.imgProp = function(options) {
	var options = $.extend({
		space: true,
		resize: false
	}, options);

	return this.each(function() {
		var img = $(this).find("img"),
			box = $(this),
			imgW, imgH, boxW, boxH,
			ratioB, ratioI;

		function clear () {
			img.removeAttr('style');
			box.removeAttr('style');

			img.css('visibility', 'hidden').css('max-width', 'none').css('max-height', 'none');
		}

		clear();

		function resize() {
			if (imgW < boxW && imgH < boxH) {
				if (ratioI > ratioB) {
					img.css('width', '100%');
				} else {
					img.css('height', '100%');
				}
			}
		}


		img.one('load.first', function() {

			function sizze () {
				imgW = img.outerWidth(true);
				imgH = img.outerHeight(true);
				boxW = box.innerWidth();
				boxH = box.innerHeight();

				ratioB = boxW / boxH;
				ratioI = imgW / imgH;


				img.css('visibility', 'visible');

				if (options.space) {
					box.css({
						'text-align': 'center',
						'overflow': 'hidden',
						'line-height': box.height() + 'px',
						'font-size': 0
					});

					img.css({
						'max-width': '100%',
						'max-height': '100%',
						'height': 'auto',
						'width': 'auto',
						'display': 'inline',
						'vertical-align': 'middle'
					}).removeAttr('width height');

					if (options.resize) {
						resize();
					}
				} else {
					var staticBoxPos = box.css('position');

					if (staticBoxPos != 'absolute' && staticBoxPos != 'fixed') {
						box.css({
							'position': 'relative'
						});
					}

					box.css({
						'overflow': 'hidden'
					});

					img.css({
						'position': 'absolute',
						'height': 'auto',
						'width': 'auto'
					}).removeAttr('width height');

					if (ratioI > ratioB) {
						img.css({
							left: '50%',
							height: boxH + 'px'
						});

						imgW = img.width();

						img.css('marginLeft', -imgW / 2 + 'px');

					} else {
						img.css({
							top: '50%',
							width: boxW + 'px',
							left: 0
						});

						imgH = img.height();

						img.css('marginTop', -imgH / 2 + 'px');
					}
				}
			}

			sizze();

			img.off('load.second').on('load.second', function () {
				clear();
				sizze();
			});

		}).each(function() {
			if(this.complete) $(this).load();
		}).on('error', function () {
			$(this).removeAttr('style');
			$(this).find('img').removeAttr('style');
		});
	});
};