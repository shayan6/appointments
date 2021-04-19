
var debounceTimeout;

function debounce(callback) {
  clearTimeout(debounceTimeout);
  debounceTimeout = setTimeout(callback, 300);
}

function isNum (val) {
  return val ? Number(val) : '';
}

function setFocus(on) {
  var element = document.activeElement;
  if (on) {
    setTimeout(function () {
      element.parentNode.classList.add("focus");
    });
  } else {
    let box = document.querySelector(".input-box");
    box.classList.remove("focus");
    $("input").each(function () {
      var $input = $(this);
      var $parent = $input.closest(".input-box");
      if ($input.val()) $parent.addClass("focus");
      else $parent.removeClass("focus");
    });
    $("textarea").each(function () {
      var $input = $(this);
      var $parent = $input.closest(".input-box");
      if ($input.val()) $parent.addClass("focus");
      else $parent.removeClass("focus");
    });
  }
}

function isMobileView () {
  return window.matchMedia('(max-device-width: 1000px)').matches;
}

// ######################################################################################
// initail events and jquery initialization #############################################
// ######################################################################################
$(document).ready(function () {

  // input focus 
  $('.input-1').on('focus', function () {
    setFocus(true);
  });
  $('.input-1').on('blur', function () {
    setFocus(false);
  });

  // autocomplete nationality
  $('#nationality').autocomplete({
    minChars: 1,
    delay: 300,
    autofocus: true,
    html: true,
    source: function ({ term }, response) {
      $.ajax({
        type: "GET",
        url: `${baseURL}/Apis/Home/getCountry`,
        contentType: "application/json",
        data: {
          pageNo: 1,
          pageSize: 10,
          search: term
        },
        beforeSend: function () {
          $(".ui-menu").html(`<li class="ui-menu-item"><div class="ui-menu-item-wrapper" tabindex="0"><img src="${baseURL}/assets/img/searching.gif" width="25" />Searching...</div></li>`)
        },
        success: function (data) {
          if (data && data.length) {
            response(data.map(el => {
              return {
                label: `${el.country_code}: ${el.country_name}`,
                value: el.country_name,
                image: 'no_image.png',
                data: el
              }
            }));
          } else {
            response([{
              label: `No Results Found!`,
            }]);
          }
        }
      });
    },
    select: function (e, { item }) {
      // on select event
      $('#country_id').val(item.data.country_id);
    },
    focus: function (e, ui) { e.preventDefault(); }
  })
  .on('click focus', function () {
    debounce(() => {
      $(this).autocomplete('search', "A");
    });
  });

});