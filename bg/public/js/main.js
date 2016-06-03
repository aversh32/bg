(function() {
  var helpPopup, pswChanger, regSlider, sidebar;

  $(function() {
    helpPopup.init('.js-help', '.pop-up__close', true, true);
    regSlider.init();
    sidebar.init('b-show-sidebar');
    pswChanger.init('js-psw-type-changer');
    $('.b-profile__preview, .js-img-prop').imgProp({
      space: false
    });
    $("input[type=checkbox]").each(function() {
      if (!$(this).next("i").length) {
        $(this).after("<i></i> ");
      }
    });
  });

  pswChanger = {
    elems: '',
    init: function(cls) {
      this.elems = $('.' + cls);
      if (this.elems.length === 0) {
        return;
      }
      return this.elems.on('click', function(e) {
        e.preventDefault();
        return pswChanger.toggle($(this));
      });
    },
    toggle: function(el) {
      var _id;
      _id = $('#' + el.attr('data-id'));
      if (_id.attr('type') === 'password') {
        el.addClass('active');
        return _id.attr('type', 'text');
      } else {
        el.removeClass('active');
        return _id.attr('type', 'password');
      }
    }
  };

  sidebar = {
    elem: $('.js-sidebar'),
    state: false,
    timer: '',
    init: function(trig) {
      $('.' + trig).on('click', function(e) {
        e.preventDefault();
        return sidebar.toggle();
      });
      return $(window).resize(function() {
        clearTimeout(sidebar.timer);
  /*      return sidebar.timer = setTimeout(function() {
          $('.b-profile__preview').imgProp({
            space: false
          });
          if (document.documentElement.clientWidth >= 768) {
            console.log('remove');
            sidebar.elem.removeAttr('style');
            if (!sidebar.state) {
              return sidebar.state = false;
            }
          }
        }, 100);*/
      });
    },
    toggle: function() {
      var minSBHeight;
      minSBHeight = $(document).outerHeight(true) - 90;
      this.elem.css('width', $('.b-side').width());
      if (this.elem.outerHeight(true) < minSBHeight) {
        this.elem.css('height', minSBHeight);
      }
      if (this.state) {
        this.state = false;
        this.elem.animate({
          'left': -100 + '%'
        }, 400, function() {
          return $(this).css('display', 'none');
        });
      } else {
        this.state = true;
        this.elem.css('display', 'block').animate({
          'left': 0 + '%'
        }, 400);
      }
      return $('.b-profile__preview').imgProp({
        space: false
      });
    }
  };

  regSlider = {
    elReg: $(".b-reg"),
    elText: $(".b-reg-text"),
    elList: $(".b-reg-list"),
    active: null,
    init: function() {
      if (this.active === null) {
        regSlider.slideTo(0);
      }
      this.elText.children('a').on('click', function() {
        regSlider.slideTo($(this).index());
      });
    },
    slideTo: function(to) {
      var link, marginSize, _centerBox, _tW;
      this.active = to;
      link = this.elText.children('a');
      link.removeClass('active').eq(to).addClass('active');
      _tW = 0;
      _centerBox = Math.round(this.elReg.width() / 2);
      if (to !== 0) {
        link.each(function(ind, el) {
          if (ind < to) {
            _tW += $(el).outerWidth(true);
          }
        });
      }
      this.elReg.width();
      this.elText.animate({
        'left': _tW * -1
      }, 600);
      marginSize = 0;
      if (to !== 0) {
        marginSize = 1000;
      }
      this.elList.animate({
        'left': (600 * to + marginSize * to) * -1
      }, 600);
      console.info('marginSize', marginSize);
      console.info('_tW', _tW);
      console.info(to);
    }
  };

  helpPopup = {
    elem: $(".pop-up__shadow"),
    bodyEl: $("body"),
    state: false,
    noFastClick: false,
    interv: '',
    open: function() {
      clearTimeout(this.interv);
      this.noFastClick = true;
      console.log('open');
      this.state = true;
      this.bodyEl.addClass("help-opened");
      this.elem.removeAttr("hidden");
      this.interv = setTimeout((function() {
        helpPopup.noFastClick = false;
      }), 300);
    },
    close: function() {
      if (this.noFastClick) {
        return;
      }
      console.log('close');
      this.state = false;
      this.bodyEl.removeClass("help-opened");
      this.elem.attr("hidden", "hidden");
    },
    init: function(open, close, shadow, keyboard) {
      var closeEl, openEl;
      console.log(open);
      openEl = $(open);
      closeEl = $(close);
      openEl.on('click', function(e) {
        e.preventDefault();
        helpPopup.open();
      });
      closeEl.on('click', function(e) {
        e.preventDefault();
        helpPopup.close();
      });
      if (shadow) {
        this.elem.on('click', function(e) {
          e.preventDefault();
          if (!$(event.target).hasClass('pop-up__shadow')) {
            return;
          }
          return helpPopup.close();
        });
      }
      if (keyboard) {
        $(window).keyup(function(e) {
          e.preventDefault();
          if (e.keyCode === 27) {
            helpPopup.close();
          }
        });
      }
    }
  };

}).call(this);

jQuery(function($){
        $.datepicker.regional['ru'] = {
                closeText: 'Закрыть',
                prevText: '&#x3c;Пред',
                nextText: 'След&#x3e;',
                currentText: 'Сегодня',
                monthNames: ['Январь','Февраль','Март','Апрель','Май','Июнь',
                'Июль','Август','Сентябрь','Октябрь','Ноябрь','Декабрь'],
                monthNamesShort: ['Янв','Фев','Мар','Апр','Май','Июн',
                'Июл','Авг','Сен','Окт','Ноя','Дек'],
                dayNames: ['воскресенье','понедельник','вторник','среда','четверг','пятница','суббота'],
                dayNamesShort: ['вск','пнд','втр','срд','чтв','птн','сбт'],
                dayNamesMin: ['Вс','Пн','Вт','Ср','Чт','Пт','Сб'],
                weekHeader: 'Не',
                dateFormat: 'dd M yy',
                firstDay: 1,
                isRTL: false,
                showMonthAfterYear: false,
                yearSuffix: ''};
        $.datepicker.setDefaults($.datepicker.regional['ru']);
});