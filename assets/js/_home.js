// cal for appointments
function displayCalendar(_year, _month) {
    
  let localization = {
    month_names: ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'],
    day_of_week: ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'],
  };
  
  var htmlContent = "",
    febNumberOfDays = "",
    counter = 1,
    month = +_month,
    year = +_year;

  if (month == 2) { // leap year
    febNumberOfDays = ((year % 100 != 0) && (year % 4 == 0) || (year % 400 == 0)) ? '29' : '28';
  }

  var dayPerMonth = [null, '31', febNumberOfDays, '31', '30', '31', '30', '31', '31', '30', '31', '30', '31']
  var nextDate = new Date(month + '/01/' + year);
  var weekdays = nextDate.getDay();
  var week_starts_on = ''; //in database

  if (week_starts_on == 'monday') {
    var weekdays2 = weekdays == 0 ? 7 : weekdays;
    var week_start_n = 1;
    var week_end_n = 7;
  }
  else {
    var weekdays2 = weekdays;
    var week_start_n = 0;
    var week_end_n = 6;
  }

  var numOfDays = dayPerMonth[month];

  for (var w = week_start_n; w < weekdays2; w++) {
    htmlContent += "<div class=\"td empty_day\"></div>";
  }

  while (counter <= numOfDays) {
    if (weekdays2 > week_end_n) {
      weekdays2 = week_start_n;
      htmlContent += "</div><div class=\"calendar_rows\">";
    }
    var date_formatted = year + '-' + zeroPad(month) + '-' + zeroPad(counter);
    var date_day_id = moment(date_formatted).format('d');
    var date_day_name = moment(date_formatted).format('dddd');

    var addClass = '';
    if ( moment(date_formatted).isBefore() ) {
      addClass = ' calendar_empty_day';
    }

    htmlContent += "<div class=\"td calendar_days" + addClass + "\" data-date=\"" + date_formatted + "\" data-day-id=\"" + date_day_id + "\" data-day-name=\"" + date_day_name + "\"><div>" + counter + "<span></span></div></div>";

    weekdays2++;
    counter++;
  }

  for( var w=weekdays2; w <= week_end_n; w++ )
  {
    htmlContent += "<div class=\"td empty_day\"></div>";
  }

  var calendarBody = "<div class=\"calendar\">";

  calendarBody += "<div class=\"calendar_rows week_names\">";

  for( var w = 0; w < localization.day_of_week.length; w++ )
  {
    if( w > week_end_n || w < week_start_n )
      continue;

    calendarBody += "<div class=\"td\">" + localization.day_of_week[ w ] + "</div>";
  }

  calendarBody += "</div>";

  calendarBody += "<div class=\"calendar_rows\">";
  calendarBody += htmlContent;
  calendarBody += "</div></div>";

  $("#calendar_area").html( calendarBody );

  
  $("#calendar_area").html( calendarBody );

  $("#calendar_area .days[data-count]:first").trigger('click');

  $(".month_name").text( localization.month_names[ +_month - 1 ] + ' ' + _year );
  $('.times_list').empty();
  $('.times_title').text('Select date');

  initializeCalendarEvent();

}

function zeroPad (n, p)
{
  p = p > 0 ? p : 2;
  n = String(n);
  while (n.length < p)
    n = '0' + n;
  return n;
}

function initializeCalendarEvent () {

  $('.td.calendar_days').not('.calendar_empty_day').on('click', function (e) {
    e.preventDefault();
    
    $('.td.calendar_days').removeClass('calendar_selected_day');
    $(this).addClass('calendar_selected_day');

    let formData = {
      'location': isNum($('#card_location .item.card_selected').attr('data-id')),
      'staff': isNum($('#card_staff .item.card_selected').attr('data-id')),
      'service': isNum($('#card_service .item.card_selected').attr('data-id')),
      'date': $(this).attr('data-date'),
      'day_id': $(this).attr('data-day-id')
    };

    // scroll time section
    // if (!isMobileView()) {
      $('.times_list').niceScroll({
        cursorcolor: "#e4ebf4",
        bouncescroll: true
      });
    // }


    // temp code ########################################################################
    let timeSlots = [ ];
    let d = '0000-01-01';
    let time = '00:00'; 

    while (time  != '23:30') {
      timeSlots.push({ 
          start_time: time
        , end_time: moment(`${d} ${time}`).add(30, 'minutes').format('HH:mm') 
      });
      time = moment(`${d} ${time}`).add(30, 'minutes').format('HH:mm');
    }

    $('.times_title').html( $(this).attr('data-date') );
    $('.times_list').html( timeSlots.map( el => /*html*/`
      <div data-time="${el.start_time}" data-endtime="${el.end_time}"><div>${el.start_time}</div><div>${el.end_time}</div></div>
    `));

    initializeTimeEvent();

  });

}

function initializeTimeEvent () {

  $('.times_list div').on('click', function (e) {
    e.preventDefault();

    $('.times_list div').removeClass('selected_time');
    $(this).addClass('selected_time');
    
    nextStep();
  });

}

// ######################################################################################
// initail events and jquery initialization #############################################
// ######################################################################################
$(document).ready(function () {

  window.m = Number(moment().format('M'));
  window.y = Number(moment().format('YYYY'));

  displayCalendar(y, m); // initial create calendar

  $('#dateOfBirth').daterangepicker({
    singleDatePicker: true,
    showDropdowns: true,
    opens: 'left',
    minYear: 1901,
    maxYear: parseInt(moment().format('YYYY'), 10)
  });

  $('.prev_month').on('click', function ()
  {
    m = m - 1;
    y = y;
    if( m <= 0 )
    {
      m = 12;
      y--;
    }
    displayCalendar(y, m);
  })

  $('.next_month').on('click', function () {
    m = m + 1;
    y = y;

    if( m > 12 )
    {
      m = 1;
      y++;
    }
    displayCalendar(y, m);
  });

});
