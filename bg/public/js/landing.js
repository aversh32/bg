(function() {
  jQuery(function() {
    var current_view;
    current_view = "main";
    $('.feedback').click(function() {
      if ($('#main').hasClass('hide')) {
        current_view = "thx";
        $('#header .btn.back, #thankyou').addClass('hide');
      } else {
        current_view = "main";
        $('#header .btn.request, #main').addClass('hide');
      }
      return $('#feedback').modal('show');
    });
    $('.request').click(function() {
      current_view = "main";
      $('#header .btn.request, #main').addClass('hide');
      return $('#request').modal('show');
    });
    $('#feedback .back, #request .back').click(function() {
      return $('#feedback, #request').modal('hide');
    });
    $('#feedback, #request').on('hidden.bs.modal', function(e) {
      if (current_view === "thx") {
        return $('#header .btn.back, #thankyou').removeClass('hide');
      } else {
        return $('#header .btn.request, #main').removeClass('hide');
      }
    });
    $('.btn-subscribe').click(function(e) {
      e.preventDefault();
      console.log('show thankyou message');
      $('#header .btn.request, #main').addClass('hide');
      return $('#header .btn.back, #thankyou').removeClass('hide');
    });
    return $('#header .btn.back').click(function() {
      console.log('hide thankyou message');
      $('#header .btn.back, #thankyou').addClass('hide');
      return $('#header .btn.request, #main').removeClass('hide');
    });
  });

  $(window).load(function() {
    return $('.landing').addClass('loaded');
  });

}).call(this);
