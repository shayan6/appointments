var appPaymentStatus;
(function($)
{
	"use strict";

	function __( key )
	{
		return key in appData.localization ? appData.localization[ key ] : key;
	}


	$(document).ready( function()
	{
		$(".appointment").each(function (index)
		{
			let booking_panel_js = $(this);
			let google_recaptcha_token;
			let google_recaptcha_action = 'booking_panel_' + index;
			let app = {

				options: {
					'templates': {
						'loader': '<div class="loading_layout"></div>'
					}
				},

				localization: {
					month_names: [ __('January'), __('February'), __('March'), __('April'), __('May'), __('June'), __('July'), __('August'), __('September'), __('October'), __('November'), __('December') ],
					day_of_week: [ __('Sun'), __('Mon'), __('Tue'), __('Wed'), __('Thu'), __('Fri'), __('Sat'), __('Sun') ] ,
				},

				calendarDateTimes: {},
				time_show_format: 1,
				calendarYear: null,
				calendarMonth: null,

				paymentWindow: null,
				paymentStatus: null,
				appointmentId: null,
				dateBasedService: false,
				serviceData: null,

				globalDayOffs: {},
				globalTimesheet: {},

				save_step_data: {},

				parseHTML: function ( html )
				{
					var range = document.createRange();
					var documentFragment = range.createContextualFragment( html );
					return documentFragment;
				},

				loading: function ( onOff )
				{
					if( typeof onOff === 'undefined' || onOff )
					{
						$('#progress').removeClass('progress_done').show();
						$({property: 0}).animate({property: 100}, {
							duration: 1000,
							step: function()
							{
								var _percent = Math.round(this.property);
								if( !$('#progress').hasClass('progress_done') )
								{
									$('#progress').css('width',  _percent+"%");
								}
							}
						});

						$('body').append( this.options.templates.loader );
					}
					else if( ! $('#progress').hasClass('progress_done') )
					{
						$('#progress').addClass('progress_done').css('width', 0);

						// IOS bug...
						setTimeout(function ()
						{
							$('.loading_layout').remove();
						}, 0);
					}
				},

				htmlspecialchars_decode: function (string, quote_style)
				{
					var optTemp = 0,
						i = 0,
						noquotes = false;
					if(typeof quote_style==='undefined')
					{
						quote_style = 2;
					}
					string = string.toString().replace(/&lt;/g, '<').replace(/&gt;/g, '>');
					var OPTS = {
						'ENT_NOQUOTES': 0,
						'ENT_HTML_QUOTE_SINGLE': 1,
						'ENT_HTML_QUOTE_DOUBLE': 2,
						'ENT_COMPAT': 2,
						'ENT_QUOTES': 3,
						'ENT_IGNORE': 4
					};
					if(quote_style===0)
					{
						noquotes = true;
					}
					if(typeof quote_style !== 'number')
					{
						quote_style = [].concat(quote_style);
						for (i = 0; i < quote_style.length; i++){
							if(OPTS[quote_style[i]]===0){
								noquotes = true;
							} else if(OPTS[quote_style[i]]){
								optTemp = optTemp | OPTS[quote_style[i]];
							}
						}
						quote_style = optTemp;
					}
					if(quote_style & OPTS.ENT_HTML_QUOTE_SINGLE)
					{
						string = string.replace(/&#0*39;/g, "'");
					}
					if(!noquotes){
						string = string.replace(/&quot;/g, '"');
					}
					string = string.replace(/&amp;/g, '&');
					return string;
				},

				htmlspecialchars: function ( string, quote_style, charset, double_encode )
				{
					var optTemp = 0,
						i = 0,
						noquotes = false;
					if(typeof quote_style==='undefined' || quote_style===null)
					{
						quote_style = 2;
					}
					string = typeof string != 'string' ? '' : string;

					string = string.toString();
					if(double_encode !== false){
						string = string.replace(/&/g, '&amp;');
					}
					string = string.replace(/</g, '&lt;').replace(/>/g, '&gt;');
					var OPTS = {
						'ENT_NOQUOTES': 0,
						'ENT_HTML_QUOTE_SINGLE': 1,
						'ENT_HTML_QUOTE_DOUBLE': 2,
						'ENT_COMPAT': 2,
						'ENT_QUOTES': 3,
						'ENT_IGNORE': 4
					};
					if(quote_style===0)
					{
						noquotes = true;
					}
					if(typeof quote_style !== 'number')
					{
						quote_style = [].concat(quote_style);
						for (i = 0; i < quote_style.length; i++)
						{
							if(OPTS[quote_style[i]]===0)
							{
								noquotes = true;
							}
							else if(OPTS[quote_style[i]])
							{
								optTemp = optTemp | OPTS[quote_style[i]];
							}
						}
						quote_style = optTemp;
					}
					if(quote_style & OPTS.ENT_HTML_QUOTE_SINGLE)
					{
						string = string.replace(/'/g, '&#039;');
					}
					if(!noquotes)
					{
						string = string.replace(/"/g, '&quot;');
					}
					return string;
				},

				ajaxResultCheck: function ( res )
				{

					if( typeof res != 'object' )
					{
						try
						{
							res = JSON.parse(res);
						}
						catch(e)
						{
							this.toast( 'Error!' );
							return false;
						}
					}

					if( typeof res['status'] == 'undefined' )
					{
						this.toast( 'Error!' );
						return false;
					}

					if( res['status'] == 'error' )
					{
						this.toast( typeof res['error_msg'] == 'undefined' ? 'Error!' : res['error_msg'] );
						return false;
					}

					if( res['status'] == 'ok' )
						return true;

					// else

					this.toast( 'Error!' );
					return false;
				},

				ajax: function ( action , params , func , loading, fnOnError )
				{
					loading = loading === false ? false : true;

					if( loading )
					{
						app.loading(true);
					}

					if( params instanceof FormData)
					{
						params.append('action', action);
						params.append('tenant_id', appData.tenant_id);
					}
					else
					{
						params['action'] = action;
						params['tenant_id'] = appData.tenant_id;
					}

					var ajaxObject =
						{
							url: appData.ajax_url,
							method: 'POST',
							data: params,
							success: function ( result )
							{
								if( loading )
								{
									app.loading( 0 );
								}

								if( app.ajaxResultCheck( result, fnOnError ) )
								{
									try
									{
										result = JSON.parse(result);
									}
									catch(e)
									{

									}
									if( typeof func == 'function' )
										func( result );
								}
								else if( typeof fnOnError == 'function' )
								{
									try
									{
										result = JSON.parse(result);
									}
									catch(e)
									{

									}

									fnOnError( result );
								}
							},
							error: function (jqXHR, exception)
							{
								if( loading )
								{
									app.loading( 0 );
								}

								app.toast( jqXHR.status + ' error!' );

								if( typeof fnOnError == 'function' )
								{
									fnOnError();
								}
							}
						};

					if( params instanceof FormData)
					{
						ajaxObject['processData'] = false;
						ajaxObject['contentType'] = false;
					}

					$.ajax( ajaxObject );

				},

				select2Ajax: function ( select, action, parameters )
				{
					var params = {};
					params['action'] = action;
					params['tenant_id'] = appData.tenant_id;

					select.select2({
						theme: 'bootstrap',
						placeholder: __('select'),
						allowClear: true,
						ajax: {
							url: appData.ajax_url,
							dataType: 'json',
							type: "POST",
							data: function ( q )
							{
								var sendParams = params;
								sendParams['q'] = q['term'];

								if( typeof parameters == 'function' )
								{
									var additionalParameters = parameters( $(this) );

									for (var key in additionalParameters)
									{
										sendParams[key] = additionalParameters[key];
									}
								}
								else if( typeof parameters == 'object' )
								{
									for (var key in parameters)
									{
										sendParams[key] = parameters[key];
									}
								}

								return sendParams;
							},
							processResults: function ( result )
							{
								if( app.ajaxResultCheck( result ) )
								{
									try
									{
										result = JSON.parse(result);
									}
									catch(e)
									{

									}

									return result;
								}
							}
						}
					});
				},

				zeroPad: function(n, p)
				{
					p = p > 0 ? p : 2;

					n = String(n);
					while (n.length < p)
						n = '0' + n;

					return n;
				},

				toast: function( title )
				{
					if( title === false )
					{
						booking_panel_js.find('.warning_message').fadeOut(200);
						return;
					}

					booking_panel_js.find('.warning_message').text( app.htmlspecialchars_decode( title, 'ENT_QUOTES' ) ).fadeIn(300);
					setTimeout(function ()
					{
						booking_panel_js.find('.warning_message').fadeOut(200);
					}, 5000);
				},

				nonRecurringCalendar: function ( _year , _month, loader, load_dates )
				{
					var now = new Date();
					loader = loader === false ? false : true;

					_month = (typeof _month == 'undefined') ? now.getMonth() : _month;
					_year = (typeof _year == 'undefined') ? now.getFullYear() : _year;

					var send_data = {
						year: _year,
						month: _month+1
					};
					send_data['staff'] = app.getSelected.staff();
					send_data['service'] = app.getSelected.service();
					send_data['location'] = app.getSelected.location();
					send_data['service_extras'] = app.getSelected.serviceExtras();
					send_data['client_time_zone'] = app.timeZoneOffset();

					app.calendarYear = _year;
					app.calendarMonth = _month;

					if( typeof load_dates != 'undefined' && load_dates === false )
					{
						app.displayCalendar( loader );
					}
					else
					{
						app.ajax( 'get_data_date_time', send_data, function ( result )
						{
							app.calendarDateTimes = result['data'];
							app.time_show_format = result['time_show_format'];
							app.displayCalendar( loader );
						} , loader );
					}
				},

				displayCalendar: function( loader )
				{
					var _year = app.calendarYear;
					var _month = app.calendarMonth;

					var htmlContent		= "",
						febNumberOfDays	= "",
						counter			= 1,
						dateNow			= new Date(_year , _month ),
						month			= dateNow.getMonth()+1,
						year			= dateNow.getFullYear(),
						currentDate		= new Date();

					if (month == 2)
					{
						febNumberOfDays = ( (year%100!=0) && (year%4==0) || (year%400==0)) ? '29' : '28';
					}

					var monthNames	= app.localization.month_names;
					var dayPerMonth	= [null, '31', febNumberOfDays ,'31','30','31','30','31','31','30','31','30','31']

					var nextDate	= new Date(month +'/01/'+year);
					var weekdays	= nextDate.getDay();
					if( appData.week_starts_on == 'monday' )
					{
						var weekdays2	= weekdays == 0 ? 7 : weekdays;
						var week_start_n = 1;
						var week_end_n = 7;
					}
					else
					{
						var weekdays2	= weekdays;
						var week_start_n = 0;
						var week_end_n = 6;
					}

					var numOfDays	= dayPerMonth[month];

					for( var w=week_start_n; w < weekdays2; w++ )
					{
						htmlContent += "<div class=\"td empty_day\"></div>";
					}

					while (counter <= numOfDays)
					{
						if (weekdays2 > week_end_n)
						{
							weekdays2 = week_start_n;
							htmlContent += "</div><div class=\"calendar_rows\">";
						}
						var date_formatted = year + '-' + app.zeroPad(month) + '-' + app.zeroPad(counter);

						if( appData.date_format == 'Y-m-d' )
						{
							var date_format_view = year + '-' + app.zeroPad(month) + '-' + app.zeroPad(counter);
						}
						else if( appData.date_format == 'd-m-Y' )
						{
							var date_format_view = app.zeroPad(counter) + '-' + app.zeroPad(month) + '-' + year;
						}
						else if( appData.date_format == 'm/d/Y' )
						{
							var date_format_view = app.zeroPad(month) + '/' + app.zeroPad(counter) + '/' + year;
						}
						else if( appData.date_format == 'd/m/Y' )
						{
							var date_format_view = app.zeroPad(counter) + '/' + app.zeroPad(month) + '/' + year;
						}

						var addClass = '';
						if( !(date_formatted in app.calendarDateTimes['dates']) || app.calendarDateTimes['dates'][ date_formatted ].length == 0 )
						{
							addClass = ' calendar_empty_day';
						}

						var loadLine = app.drawLoadLine( date_formatted );

						htmlContent +="<div class=\"td calendar_days"+addClass+"\" data-date=\"" + date_formatted + "\" data-date-format=\"" + date_format_view + "\"><div>"+counter+"<span>" + loadLine + "</span></div></div>";

						weekdays2++;
						counter++;
					}

					for( var w=weekdays2; w <= week_end_n; w++ )
					{
						htmlContent += "<div class=\"td empty_day\"></div>";
					}

					var calendarBody = "<div class=\"calendar\">";

					calendarBody += "<div class=\"calendar_rows week_names\">";

					for( var w = 0; w < app.localization.day_of_week.length; w++ )
					{
						if( w > week_end_n || w < week_start_n )
							continue;

						calendarBody += "<div class=\"td\">" + app.localization.day_of_week[ w ] + "</div>";
					}

					calendarBody += "</div>";

					calendarBody += "<div class=\"calendar_rows\">";
					calendarBody += htmlContent;
					calendarBody += "</div></div>";

					booking_panel_js.find("#calendar_area").html( calendarBody );

					booking_panel_js.find("#calendar_area .days[data-count]:first").trigger('click');

					booking_panel_js.find(".month_name").text( monthNames[ _month ] + ' ' + _year );
					booking_panel_js.find('.times_list').empty();
					booking_panel_js.find('.times_title').text(__('Select date'));

					if( !loader )
					{
						booking_panel_js.find(".preloader_card3_box").hide();

						booking_panel_js.find('.appointment_container_body > [data-step-id="date_time"]').fadeIn(200, function()
						{
							booking_panel_js.find(".appointment_container_body").scrollTop(0);
							app.niceScroll();
						});
					}
				},

				drawLoadLine: function( date )
				{
					var data = date in app.calendarDateTimes['dates'] ? app.calendarDateTimes['dates'][ date ] : {};

					var start_time	= app.timeToMin( date in app.calendarDateTimes['timesheet'] && app.calendarDateTimes['timesheet'][ date ]['start'] != '' ? app.calendarDateTimes['timesheet'][ date ]['start'] : '09:00' );
					var end_time	= app.timeToMin( date in app.calendarDateTimes['timesheet'] && app.calendarDateTimes['timesheet'][ date ]['end'] != '' ? app.calendarDateTimes['timesheet'][ date ]['end'] : '18:00' );
					end_time		= end_time == 0 || start_time > end_time ? 24 * 60 + end_time : end_time;

					var diff = end_time - start_time;

					var day_schedule = [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0];
					var per_time = parseInt( diff / day_schedule.length * 10 ) / 10;

					var line = '';
					for( var j = 0; j < day_schedule.length; j++ )
					{
						var startt1 = start_time + per_time * j;
						var endt1	= startt1 + per_time;
						var avg = (endt1 + startt1) / 2;

						var isFree = false;

						for( var n = 0; n < data.length; n++ )
						{
							var start_time3 = app.timeToMin(data[n]['start_time']);
							var end_time3 = app.timeToMin(data[n]['end_time']);

							if( start_time3 < avg && end_time3 > avg )
							{
								isFree = true;
								break;
							}
						}

						line += '<i '+(isFree?'a':'b')+' data-test="'+(startt1+':'+endt1)+'"></i>';
					}

					return line;
				},

				timeToMin: function(str)
				{
					str = str.split(':');

					return parseInt(str[0]) * 60 + parseInt(str[1]);
				},

				timeZoneOffset: function()
				{
					if( appData.client_time_zone == 'off' )
						return  '-';

					var current_date = new Date();
					return current_date.getTimezoneOffset();
				},

				datePickerFormat: function()
				{
					if( appData.date_format == 'd-m-Y' )
					{
						return 'dd-mm-yyyy';
					}
					else if( appData.date_format == 'm/d/Y' )
					{
						return 'mm/dd/yyyy';
					}
					else if( appData.date_format == 'd/m/Y' )
					{
						return 'dd/mm/yyyy';
					}

					return 'yyyy-mm-dd';
				},

				convertDate: function( date, from, to )
				{
					if( date == '' )
						return date;
					if( typeof to === 'undefined' )
					{
						to = app.datePickerFormat();
					}

					to = to.replace('yyyy', 'Y').replace('dd', 'd').replace('mm', 'm');
					from = from.replace('yyyy', 'Y').replace('dd', 'd').replace('mm', 'm');

					var delimetr = from.indexOf('-') > -1 ? '-' : ( from.indexOf('.') > -1 ? '.' : '/' );
					var delimetr_to = to.indexOf('-') > -1 ? '-' : ( to.indexOf('.') > -1 ? '.' : '/' );
					var date_split = date.split(delimetr);
					var date_from_split = from.split(delimetr);
					var date_to_split = to.split(delimetr_to);

					var parts = {'m':0, 'd':0, 'Y':0};

					date_from_split.forEach(function( val, i )
					{
						parts[ val ] = i;
					});

					var new_date = '';
					date_to_split.forEach(function( val, j )
					{
						new_date += (new_date == '' ? '' : delimetr_to) + date_split[ parts[ val ] ];
					});

					return new_date;
				},

				getSelected: {

					location: function()
					{
						if( booking_panel_js.find('.appointment_step_element[data-step-id="location"]').hasClass('menu_hidden') )
						{
							var val = booking_panel_js.find('.appointment_step_element[data-step-id="location"]').data('value');
						}
						else
						{
							var val = booking_panel_js.find(".appointment_container_body > [data-step-id=\"location\"] > .card_selected").data('id');
						}

						return val ? val : '';
					},

					staff: function()
					{
						if( booking_panel_js.find('.appointment_step_element[data-step-id="staff"]').hasClass('menu_hidden') )
						{
							var val = booking_panel_js.find('.appointment_step_element[data-step-id="staff"]').data('value');
						}
						else
						{
							var val = booking_panel_js.find(".appointment_container_body > [data-step-id=\"staff\"] > .card_selected").data('id');
						}

						return val ? val : '';
					},

					service: function()
					{
						if( booking_panel_js.find('.appointment_step_element[data-step-id="service"]').hasClass('menu_hidden') )
						{
							var val = booking_panel_js.find('.appointment_step_element[data-step-id="service"]').data('value');
						}
						else
						{
							var val = booking_panel_js.find(".appointment_container_body > [data-step-id=\"service\"] > .service_card_selected").data('id');
						}

						return val ? val : '';
					},

					serviceCategory: function()
					{
						return booking_panel_js.find('.appointment_step_element[data-step-id="service"]').data('service-category');
					},

					serviceIsRecurring: function()
					{
						if( booking_panel_js.find('.appointment_step_element[data-step-id="service"]').hasClass('menu_hidden') )
						{
							var val = booking_panel_js.find('.appointment_step_element[data-step-id="service"]').data('is-recurring');
						}
						else
						{
							var val = booking_panel_js.find('.appointment_container_body > [data-step-id="service"] > .service_card_selected').data('is-recurring');
						}

						return val == '1' ? true : false;
					},

					serviceExtras: function()
					{
						var extras = {};

						booking_panel_js.find(".appointment_container_body > [data-step-id=\"service_extras\"] > .service_extra_card_selected").each(function()
						{
							var extra_id	= $(this).data('id'),
								quantity	= parseInt( $(this).find('.service_extra_quantity_input').val() );

							if( quantity > 0  )
							{
								extras[ extra_id ] = quantity;
							}
						});

						return extras;
					},

					date: function()
					{
						if( app.getSelected.serviceIsRecurring() )
							return '';

						var val = booking_panel_js.find(".calendar_selected_day").data('date');
						return val ? val : '';
					},

					time: function()
					{
						if( app.getSelected.serviceIsRecurring() )
							return app.getSelected.recurringTime();

						var val = booking_panel_js.find(".selected_time").data('time');
						return val ? val : '';
					},

					formData: function ()
					{
						var data			= { data: {}, custom_fields: {} },
							customFields	= {};

						var form = booking_panel_js.find(".appointment_container_body > [data-step-id=\"information\"]");

						form.find('input[name]').each(function()
						{
							var name	= $(this).attr('name'),
								value	= name == 'phone' ? $(this).data('iti').getNumber(intlTelInputUtils.numberFormat.E164) : $(this).val();

							data['data'][name] = value;
						});

						form.find("#custom_form [data-input-id][type!='checkbox'][type!='radio'], #custom_form [data-input-id][type='checkbox']:checked, #custom_form [data-input-id][type='radio']:checked").each(function()
						{
							var inputId		= $(this).data('input-id'),
								inputVal	= $(this).val();

							if( !inputVal )
							{
								inputVal = '';
							}

							if( inputVal != '' && $(this).data('isdatepicker') )
							{
								inputVal = app.convertDate( inputVal, app.datePickerFormat(), 'Y-m-d' );
							}

							if( $(this).attr('type') == 'file' )
							{
								customFields[ inputId ] = $(this)[0].files[0] ? $(this)[0].files[0] : 'appointment_finished_with_error';
							}
							else
							{
								if( typeof customFields[ inputId ] == 'undefined' )
								{
									customFields[ inputId ] = inputVal;
								}
								else
								{
									customFields[ inputId ] += ',' + inputVal;
								}
							}
						});

						data['custom_fields'] = customFields;

						return data;
					},

					paymentMethod: function ()
					{
						if( booking_panel_js.find('.appointment_step_element[data-step-id="confirm_details"]').hasClass('menu_hidden') )
							return 'local';

						return booking_panel_js.find('.payment_method.payment_method_selected').data('payment-type');
					},

					paymentDepositFullAmount: function ()
					{
						return booking_panel_js.find('input[name="input_deposit"][type="radio"]:checked').val() == '0' ? true : false;
					},

					recurringStartDate: function()
					{
						var val = booking_panel_js.find("#recurring_start").val();
						if( val == '' || val == undefined )
							return val;

						return app.convertDate( val, app.datePickerFormat(), 'Y-m-d' );
					},

					recurringEndDate: function()
					{
						var val = booking_panel_js.find("#recurring_end").val();
						if( val == '' || val == undefined )
							return val;

						return app.convertDate( val, app.datePickerFormat(), 'Y-m-d' );
					},

					recurringTimesArr: function()
					{
						if( !app.serviceData )
							return {};

						var repeatType		=	app.serviceData['repeat_type'],
							recurringTimes	=	{};

						if( repeatType == 'weekly' )
						{
							booking_panel_js.find(".times_days_of_week_area > .active_day").each(function()
							{
								var dayNum = $(this).data('day');
								var time = $(this).find('.wd_input_time').val();

								recurringTimes[ dayNum ] = time;
							});

							recurringTimes = JSON.stringify( recurringTimes );
						}
						else if( repeatType == 'daily' )
						{
							recurringTimes = booking_panel_js.find("#daily_recurring_frequency").val();
						}
						else if( repeatType == 'monthly' )
						{
							recurringTimes = booking_panel_js.find("#monthly_recurring_type").val();
							if( recurringTimes == 'specific_day' )
							{
								recurringTimes += ':' + ( booking_panel_js.find("#monthly_recurring_day_of_month").val() == null ? '' : booking_panel_js.find("#monthly_recurring_day_of_month").val().join(',') );
							}
							else
							{
								recurringTimes += ':' + booking_panel_js.find("#monthly_recurring_day_of_week").val();
							}
						}

						return recurringTimes;
					},

					recurringTimesArrFinish: function()
					{
						var recurringDates = [];
						var hasTimeError = false;

						booking_panel_js.find("#recurring_dates > tr").each(function()
						{
							var sDate = $(this).find('[data-date]').data('date');
							var sTime = $(this).find('[data-time]').data('time');
							// if tried to change the time
							if( $(this).find('.time_select').length )
							{
								sTime = $(this).find('.time_select').val();
								if( sTime == '' )
								{
									hasTimeError = true;
								}
							}
							else if( $(this).find('.data_has_error').length > 0 )
							{
								hasTimeError = true;
							}

							recurringDates.push([ sDate, sTime ]);
						});

						if( hasTimeError )
						{
							return false;
						}

						return JSON.stringify( recurringDates );
					},

					recurringTime: function ()
					{
						if( !app.serviceData )
							return  '';

						var repeatType	=	app.serviceData['repeat_type'],
							time		=	'';

						if( repeatType == 'daily' )
						{
							time = booking_panel_js.find("#daily_time").val();
						}
						else if( repeatType == 'monthly' )
						{
							time = booking_panel_js.find("#monthly_time").val();
						}

						return time;
					}

				},

				loadStep: function( step )
				{
					var current_step_el	= booking_panel_js.find('.appointment_step_element.active_step');
					var next_step_el	= booking_panel_js.find('.appointment_step_element[data-step-id="'+step+'"]');

					while( next_step_el.hasClass('menu_hidden') )
						next_step_el = next_step_el.next();

					booking_panel_js.find(".next_step, .prev_step").attr('disabled', true);

					var step_id		= next_step_el.data('step-id');
					var loader		= booking_panel_js.find('.preloader_' + next_step_el.data('loader') + '_box');

					if( current_step_el.length > 0 )
					{
						current_step_el.removeClass('active_step');
						var current_step_id	= current_step_el.data('step-id');
					}
					next_step_el.addClass('active_step');
					booking_panel_js.find(".appointment_container_header").text( next_step_el.data('title') );

					var next2_step_el	= next_step_el.next('.appointment_step_element');

					while( next2_step_el.hasClass('menu_hidden') )
						next2_step_el = next2_step_el.next();

					var next_step_btn_text = next2_step_el.length == 0 ? __('CONFIRM BOOKING') : __('NEXT STEP');
					booking_panel_js.find('.next_step').text( next_step_btn_text );

					var loadNewStep = function()
					{
						if( !app.needToReload(step_id) )
						{
							booking_panel_js.find('.appointment_container_body > [data-step-id="' + step_id + '"]').show();

							app.fadeInAnimate('.appointment_container_body > [data-step-id="' + step_id + '"] .fade');

							setTimeout(function ()
							{
								booking_panel_js.find(".appointment_container_body").scrollTop(0);
								app.niceScroll();
								booking_panel_js.find(".next_step, .prev_step").attr('disabled', false);
							}, 101 + booking_panel_js.find('.appointment_container_body > [data-step-id="' + step_id + '"] .fade').length * 50);
						}
						else
						{
							loader.removeClass('hidden').hide().fadeIn(200);

							booking_panel_js.find('.appointment_container_body > [data-step-id="' + step_id + '"]').empty();

							var step_data = app.ajaxParametersPerStep(step_id);
							app.ajax( 'get_data_' + step_id, step_data, function ( result )
							{
								loader.fadeOut(200, function ()
								{
									booking_panel_js.find('.appointment_container_body > [data-step-id="' + step_id + '"]').show().html( app.htmlspecialchars_decode( result['html'] ) );

									app.fadeInAnimate('.appointment_container_body > [data-step-id="' + step_id + '"] .fade');

									booking_panel_js.find(".next_step, .prev_step").attr('disabled', false);

									setTimeout(function ()
									{
										booking_panel_js.find(".appointment_container_body").scrollTop(0);
										app.niceScroll();
									}, 101 + booking_panel_js.find('.appointment_container_body > [data-step-id="' + step_id + '"] .fade').length * 50);

									if( step_id == 'information' )
									{
										app.initCustomFormElements( );

										var phone_input = booking_panel_js.find('#bkntc_input_phone');
										phone_input.data('iti', window.intlTelInput( phone_input[0], {
											utilsScript: appData.assets_url + "js/utilsIntlTelInput.js",
											initialCountry: phone_input.data('country-code')
										}));
									}
									else if( step_id == 'date_time' )
									{
										app.serviceData = null;
										app.dateBasedService = result['service_info']['date_based'];

										if( result['service_type'] == 'non_recurring' )
										{
											app.calendarDateTimes = result['data'];
											app.time_show_format = result['time_show_format'];
											app.nonRecurringCalendar(undefined, undefined, false, false);
											booking_panel_js.find(".times_list").niceScroll({
												cursorcolor: "#e4ebf4",
												bouncescroll: true
											});
										}
										else
										{
											app.serviceData = result['service_info'];
											app.initRecurringElements();
										}
									}

									if( app.getSelected.serviceIsRecurring() )
									{
										booking_panel_js.find('.appointment_step_element[data-step-id="recurring_info"].menu_hidden').slideDown(300, function ()
										{
											$(this).removeClass('menu_hidden');
											app.refreshStepIndexes();
										});
									}
									else
									{
										booking_panel_js.find('.appointment_step_element[data-step-id="recurring_info"]:not(.menu_hidden)').slideUp(300, function ()
										{
											$(this).addClass('menu_hidden');
											app.refreshStepIndexes();
										});
									}

									delete step_data['action'];
									app.save_step_data[ step_id ] = step_data;

									if( step_id == 'confirm_details' )
									{
										if( app.getSelected.paymentMethod() == 'woocommerce' && booking_panel_js.find('.redirect_to_wc').length > 0 )
										{
											booking_panel_js.find(".next_step").attr('disabled', false).trigger('click');
										}
									}
								});

							}, false , function ()
							{
								loader.fadeOut(200, function ()
								{
									booking_panel_js.find(".next_step, .prev_step").attr('disabled', false);
									booking_panel_js.find(".appointment_step_element.active_step").removeClass('active_step').prev().addClass('active_step').removeClass('selected_step');

									if( current_step_el.length > 0 )
									{
										booking_panel_js.find('.appointment_container_body > [data-step-id="' + current_step_id + '"]').fadeIn(100);
									}
									else
									{
										setTimeout(function ()
										{
											app.loadStep(step);
										}, 3000);
									}
								});
							} );
						}
					}

					if( current_step_el.length > 0 )
					{
						booking_panel_js.find('.appointment_container_body > [data-step-id="' + current_step_id + '"]').fadeOut( 200, loadNewStep);
					}
					else
					{
						loadNewStep();
					}
				},

				ajaxParametersPerStep: function( step_id )
				{
					var filter_data = {};

					if( step_id == 'location' )
					{
						filter_data['staff'] = app.getSelected.staff();
						filter_data['service'] = app.getSelected.service();
					}
					else if( step_id == 'staff' )
					{
						filter_data['service'] = app.getSelected.service();
						filter_data['location'] = app.getSelected.location();
						filter_data['service_extras'] = app.getSelected.serviceExtras();
						filter_data['date'] = app.getSelected.date();
						filter_data['time'] = app.getSelected.time();
					}
					else if( step_id == 'service' )
					{
						filter_data['staff'] = app.getSelected.staff();
						filter_data['location'] = app.getSelected.location();
						filter_data['category'] = app.getSelected.serviceCategory();
					}
					else if( step_id == 'service_extras' )
					{
						filter_data['service'] = app.getSelected.service();
					}
					else if( step_id == 'date_time' )
					{
						filter_data['staff'] = app.getSelected.staff();
						filter_data['service'] = app.getSelected.service();
						filter_data['service_extras'] = app.getSelected.serviceExtras();
						filter_data['client_time_zone'] = app.timeZoneOffset();
					}
					else if( step_id == 'recurring_info' )
					{
						filter_data['service'] = app.getSelected.service();
						filter_data['staff'] = app.getSelected.staff();
						filter_data['location'] = app.getSelected.location();
						filter_data['service_extras'] = app.getSelected.serviceExtras();
						filter_data['time'] = app.getSelected.recurringTime();
						filter_data['recurring_start_date'] = app.getSelected.recurringStartDate();
						filter_data['recurring_end_date'] = app.getSelected.recurringEndDate();
						filter_data['recurring_times'] = app.getSelected.recurringTimesArr();
						filter_data['client_time_zone'] = app.timeZoneOffset();
					}
					else if( step_id == 'information' )
					{
						filter_data['service'] = app.getSelected.service();
					}
					else if( step_id == 'confirm_details' )
					{
						filter_data['location'] = app.getSelected.location();
						filter_data['staff'] = app.getSelected.staff();
						filter_data['service'] = app.getSelected.service();
						filter_data['service_extras'] = app.getSelected.serviceExtras();
						filter_data['date'] = app.getSelected.date();
						filter_data['time'] = app.getSelected.time();

						filter_data['recurring_start_date'] = app.getSelected.recurringStartDate();
						filter_data['recurring_end_date'] = app.getSelected.recurringEndDate();
						filter_data['recurring_times'] = app.getSelected.recurringTimesArr();
						filter_data['appointments'] = app.getSelected.recurringTimesArrFinish();
						filter_data['client_time_zone'] = app.timeZoneOffset();
					}

					return filter_data;
				},

				needToReload: function( step_id )
				{
					if( step_id == 'confirm_details' )
						return true;

					if( step_id in app.save_step_data && JSON.stringify(app.save_step_data[step_id]) == JSON.stringify(app.ajaxParametersPerStep( step_id )) )
						return false;

					return true;
				},

				calcRecurringTimes: function()
				{
					app.serviceFixPeriodEndDate();

					var fullPeriod			=	app.serviceData['full_period_value'];
					var isFullPeriodFixed	=	fullPeriod > 0 ;
					var repeatType			=	app.serviceData['repeat_type'];
					var startDate			=	app.getSelected.recurringStartDate();
					var endDate				=	app.getSelected.recurringEndDate();

					if( startDate == '' || endDate == '' )
						return;

					startDate	= new Date( startDate );
					endDate		= new Date( endDate );

					var cursor	= startDate,
						numberOfAppointments = 0,
						frequency = (repeatType == 'daily') ? booking_panel_js.find('#daily_recurring_frequency').val() : 1;

					if( !( frequency >= 1 ) )
					{
						frequency = 1;
						if( repeatType == 'daily' )
						{
							booking_panel_js.find('#daily_recurring_frequency').val('1');
						}
					}

					var activeDays = {};
					if( repeatType == 'weekly' )
					{
						booking_panel_js.find(".times_days_of_week_area > .active_day").each(function()
						{
							activeDays[ $(this).data('day') ] = true;
						});

						if( $.isEmptyObject( activeDays ) )
						{
							return;
						}
					}
					else if( repeatType == 'monthly' )
					{
						var monthlyRecurringType = booking_panel_js.find("#monthly_recurring_type").val();
						var monthlyDayOfWeek = booking_panel_js.find("#monthly_recurring_day_of_week").val();

						var selectedDays = booking_panel_js.find("#monthly_recurring_day_of_month").select2('val');

						if( selectedDays )
						{
							for( var i = 0; i < selectedDays.length; i++ )
							{
								activeDays[ selectedDays[i] ] = true;
							}
						}
					}

					while( cursor <= endDate )
					{
						var weekNum = cursor.getDay();
						var dayNumber = parseInt( cursor.getDate() );
						weekNum = weekNum > 0 ? weekNum : 7;
						var dateFormat = cursor.getFullYear() + '-' + app.zeroPad( cursor.getMonth() + 1 ) + '-' + app.zeroPad( cursor.getDate() );

						if( repeatType == 'monthly' )
						{
							if( ( monthlyRecurringType == 'specific_day' && typeof activeDays[ dayNumber ] != 'undefined' ) || app.getMonthWeekInfo(cursor, monthlyRecurringType, monthlyDayOfWeek) )
							{
								if(
									// if is not off day for staff or service
									!( typeof app.globalTimesheet[ weekNum-1 ] != 'undefined' && app.globalTimesheet[ weekNum-1 ]['day_off'] ) &&
									// if is not holiday for staff or service
									typeof app.globalDayOffs[ dateFormat ] == 'undefined'
								)
								{
									numberOfAppointments++;
								}
							}
						}
						else if(
							// if weekly repeat type then only selected days of week...
							( typeof activeDays[ weekNum ] != 'undefined' || repeatType == 'daily' ) &&
							// if is not off day for staff or service
							!( typeof app.globalTimesheet[ weekNum-1 ] != 'undefined' && app.globalTimesheet[ weekNum-1 ]['day_off'] ) &&
							// if is not holiday for staff or service
							typeof app.globalDayOffs[ dateFormat ] == 'undefined'
						)
						{
							numberOfAppointments++;
						}

						cursor = new Date( cursor.getTime() + 1000 * 24 * 3600 * frequency );
					}

					booking_panel_js.find('#recurring_times').val( numberOfAppointments );

				},

				initRecurringElements: function( )
				{
					app.select2Ajax( booking_panel_js.find(".wd_input_time, #daily_time, #monthly_time"), 'get_available_times_all', function( select )
					{
						return {
							service: app.getSelected.service(),
							staff: app.getSelected.staff(),
							location: app.getSelected.location(),
							day_number: ( select.attr('id') == 'daily_time' || select.attr('id') == 'monthly_time' ) ? -1 : select.attr('id').replace('time_wd_', '')
						}
					});

					booking_panel_js.find("#monthly_recurring_day_of_month").select2({
						theme: 'bootstrap',
						placeholder: __('select'),
						allowClear: true
					});
					booking_panel_js.find("#monthly_recurring_type, #monthly_recurring_day_of_week").select2({
						theme: 'bootstrap',
						placeholder: __('select'),
						minimumResultsForSearch: -1
					});

					booking_panel_js.find('#monthly_recurring_type').trigger('change');

					app.initDatepicker( booking_panel_js.find("#recurring_start") );
					app.initDatepicker( booking_panel_js.find("#recurring_end") );

					app.serviceFixPeriodEndDate();
					app.serviceFixFrequency();
					booking_panel_js.find("#recurring_start").trigger('change');
				},

				serviceFixPeriodEndDate: function()
				{
					var serviceData = app.serviceData;

					if( serviceData && serviceData['full_period_value'] > 0 )
					{
						booking_panel_js.find("#recurring_end").attr('disabled', true);
						booking_panel_js.find("#recurring_times").attr('disabled', true);

						var startDate = app.getSelected.recurringStartDate();

						if( serviceData['full_period_type'] == 'month' )
						{
							endDate = new Date( startDate );
							endDate.setMonth( endDate.getMonth() + parseInt( serviceData['full_period_value'] ) );
							endDate.setDate( endDate.getDate() - 1 );

							booking_panel_js.find("#recurring_end").val( app.convertDate( endDate.getFullYear() + '-' + app.zeroPad( endDate.getMonth() + 1 ) + '-' + app.zeroPad( endDate.getDate() ), 'Y-m-d' ) );
						}
						else if( serviceData['full_period_type'] == 'week' )
						{
							endDate = new Date( startDate );
							endDate.setDate( endDate.getDate() + parseInt( serviceData['full_period_value'] ) * 7 - 1 );

							booking_panel_js.find("#recurring_end").val( app.convertDate( endDate.getFullYear() + '-' + app.zeroPad( endDate.getMonth() + 1 ) + '-' + app.zeroPad( endDate.getDate() ), 'Y-m-d' ) );
						}
						else if( serviceData['full_period_type'] == 'day' )
						{
							endDate = new Date( startDate );
							endDate.setDate( endDate.getDate() + parseInt( serviceData['full_period_value'] ) - 1 );

							booking_panel_js.find("#recurring_end").val( app.convertDate( endDate.getFullYear() + '-' + app.zeroPad( endDate.getMonth() + 1 ) + '-' + app.zeroPad( endDate.getDate() ), 'Y-m-d' ) );
						}
						else if( serviceData['full_period_type'] == 'time' )
						{
							booking_panel_js.find("#recurring_times").val( serviceData['full_period_value'] ).trigger('keyup');
						}
					}
					else
					{
						booking_panel_js.find("#recurring_end").attr('disabled', false);
						booking_panel_js.find("#recurring_times").attr('disabled', false);

						if( app.getSelected.recurringEndDate() == '' )
						{
							var startDate = new Date( app.getSelected.recurringStartDate() );
							var endDate = new Date( startDate.setMonth( startDate.getMonth() + 1 ) );

							booking_panel_js.find("#recurring_end").val( app.convertDate( endDate.getFullYear() + '-' + app.zeroPad( endDate.getMonth() + 1 ) + '-' + app.zeroPad( endDate.getDate() ), 'Y-m-d' ) );
						}
					}
				},

				serviceFixFrequency: function()
				{
					var serviceData = app.serviceData;

					if( serviceData && serviceData['repeat_frequency'] > 0 && serviceData['repeat_type'] == 'daily' )
					{
						booking_panel_js.find("#daily_recurring_frequency").val( serviceData['repeat_frequency'] ).attr('disabled', true);
					}
					else
					{
						booking_panel_js.find("#daily_recurring_frequency").attr('disabled', false);
					}
				},

				getMonthWeekInfo: function( date, type, dayOfWeek )
				{
					var jsDate = new Date( date ),
						weekd = jsDate.getDay();
					weekd = weekd == 0 ? 7 : weekd;

					if( weekd != dayOfWeek )
					{
						return false;
					}

					var month = jsDate.getMonth()+1,
						year = jsDate.getFullYear();

					if( type == 'last' )
					{
						var nextWeek = new Date(jsDate.getTime());
						nextWeek.setDate( nextWeek.getDate() + 7 );

						return nextWeek.getMonth()+1 != month ? true : false;
					}

					var firstDayOfMonth = new Date( year + '-' + app.zeroPad( month ) + '-01' ),
						firstWeekDay = firstDayOfMonth.getDay();
					firstWeekDay = firstWeekDay == 0 ? 7 : firstWeekDay;

					var dif = ( dayOfWeek >= firstWeekDay ? dayOfWeek : parseInt(dayOfWeek)+7 ) - firstWeekDay;

					var days = jsDate.getDate() - dif,
						dNumber = parseInt(days / 7)+1;

					return type == dNumber ? true : false;
				},

				initCustomFormElements: function ()
				{
					booking_panel_js.find("#custom_form input[type='date']").each(function()
					{
						$(this).attr('type', 'text').data('isdatepicker', true);

						app.initDatepicker( $(this) );
					});

					app.select2Ajax( booking_panel_js.find("#custom_form .custom-input-select2"), 'get_custom_field_choices', function(input )
					{
						var inputId = input.data('input-id');

						return {
							input_id: inputId
						}
					});

					booking_panel_js.find("#custom_form").on('click', '.remove_custom_file_btn', function()
					{
						var placeholder = $(this).data('placeholder');

						$(this).parent().text( placeholder );
					});
				},

				confirmAppointment: function ()
				{
					var data = new FormData();
					var payment_method = app.getSelected.paymentMethod();

					data.append( 'id', app.appointmentId );
					data.append( 'location', app.getSelected.location() );
					data.append( 'staff', app.getSelected.staff() );
					data.append( 'service', app.getSelected.service() );
					data.append( 'coupon', (booking_panel_js.find('.add_coupon.coupon_ok').length > 0 ? booking_panel_js.find('#coupon').val() : '') );
					data.append( 'giftcard', (booking_panel_js.find('.add_giftcard.giftcard_ok').length > 0 ? booking_panel_js.find('#giftcard').val() : '') );

					var extras = app.getSelected.serviceExtras();

					for( var eid in extras )
					{
						if( isNaN(parseInt(eid)) )
							continue;

						data.append( 'service_extras['+eid+']', extras[eid] );
					}

					data.append( 'date', app.getSelected.date() );
					data.append( 'time', app.getSelected.time() );

					data.append( 'recurring_start_date', app.getSelected.recurringStartDate() );
					data.append( 'recurring_end_date', app.getSelected.recurringEndDate() );
					data.append( 'recurring_times', app.getSelected.recurringTimesArr() );
					data.append( 'appointments', app.getSelected.recurringTimesArrFinish() );

					var customFields = app.getSelected.formData();
					for( var n in customFields['data'] )
					{
						data.append( 'customer_data['+n+']', customFields['data'][n] );
					}
					for( var n in customFields['custom_fields'] )
					{
						data.append( 'custom_fields['+n+']', customFields['custom_fields'][n] );
					}

					data.append( 'payment_method', payment_method );
					data.append( 'deposit_full_amount', app.getSelected.paymentDepositFullAmount() ? 1 : 0 );
					data.append( 'client_time_zone', app.timeZoneOffset() );
					data.append( 'google_recaptcha_token', google_recaptcha_token );
					data.append( 'google_recaptcha_action', google_recaptcha_action );

					if( payment_method == 'paypal' || payment_method == 'stripe' )
					{
						appPaymentStatus = app.paymentFinished;
						app.paymentWindow = window.open( '', 'payment_window', 'width=1000,height=700' );
						app.waitPaymentFinish();
					}

					app.ajax( 'confirm', data, function ( result )
					{
						app.refreshGoogleReCaptchaToken();

						app.appointmentId = result['id'];

						if( payment_method == 'paypal' || payment_method == 'stripe' )
						{
							if( result['status'] == 'error' )
							{
								app.toast( result['error_msg'] );
								app.paymentWindow.close();
								return;
							}

							if( !app.paymentWindow.closed )
							{
								app.loading(1);
								app.paymentWindow.location.href = result['url'];
							}
						}
						else if( payment_method == 'woocommerce' && 'woocommerce_cart_url' in result )
						{
							app.loading(1);
							window.location.href = result['woocommerce_cart_url'];
						}
						else
						{
							app.paymentFinished( true );
							app.showFinishStep();
						}

						booking_panel_js.find('#add_to_google_calendar_btn').data('url', result['google_url'] );
					} , true, function( result )
					{
						if( typeof result['id'] != 'undefined' )
						{
							app.appointmentId = result['id'];
						}

						if( payment_method == 'paypal' || payment_method == 'stripe' )
						{
							app.paymentWindow.close();
						}
					});
				},

				waitPaymentFinish: function()
				{
					if( app.paymentWindow.closed )
					{
						app.loading(0);

						app.showFinishStep();

						return;
					}

					setTimeout( app.waitPaymentFinish, 1000 );
				},

				paymentFinished: function ( status )
				{
					app.paymentStatus = status;
					booking_panel_js.find(".appointment_finished_code").text( app.zeroPad( app.appointmentId, 4 ) );

					if( app.paymentWindow && !app.paymentWindow.closed )
					{
						app.paymentWindow.close();
					}
				},

				showFinishStep: function ()
				{
					if( app.paymentStatus === true )
					{
						booking_panel_js.find('.appointment_container').fadeOut(95);
						booking_panel_js.find('.appointment_steps').fadeOut(100, function ()
						{
							booking_panel_js.find('.appointment_finished').fadeIn(100).css('display', 'flex');
						});
					}
					else
					{
						booking_panel_js.find('.appointment_container_body > [data-step-id="confirm_details"]').fadeOut( 150, function()
						{
							booking_panel_js.find('.appointment_container_body > .appointment_finished_with_error').removeClass('hidden').hide().fadeIn( 150 );
						});

						booking_panel_js.find('.next_step').fadeOut( 150, function()
						{
							booking_panel_js.find('.try_again_btn').removeClass('hidden').hide().fadeIn( 150 );
						});
						booking_panel_js.find('.prev_step').css('opacity', '0').attr('disabled', true);
					}
				},

				stepValidation: function ( step )
				{
					if( step == 'location' )
					{
						if( !( app.getSelected.location() > 0 ) )
						{
							return __('select_location');
						}
					}
					else if( step == 'staff' )
					{
						if( !( app.getSelected.staff() > 0 || app.getSelected.staff() == -1 ) )
						{
							return __('select_staff');
						}
					}
					else if( step == 'service' )
					{
						if( !( app.getSelected.service() > 0 ) )
						{
							return __('select_service');
						}
					}
					else if( step == 'date_time' )
					{
						if( app.getSelected.serviceIsRecurring() )
						{
							var service_repeat_type = app.serviceData['repeat_type'];

							if( service_repeat_type == 'weekly' )
							{
								if( booking_panel_js.find('.times_days_of_week_area > .active_day').length == 0 )
								{
									return __('select_week_days');
								}

								var timeNotSelected = false;
								booking_panel_js.find('.times_days_of_week_area > .active_day').each(function ()
								{
									if( $(this).find('.wd_input_time').val() == null )
									{
										timeNotSelected = true;
										return;
									}
								});

								if( timeNotSelected )
								{
									return __('date_time_is_wrong');
								}
							}
							else if( service_repeat_type == 'monthly' )
							{

							}

							if( app.getSelected.recurringStartDate() == '' )
							{
								return __('select_start_date');
							}

							if( app.getSelected.recurringEndDate() == '' )
							{
								return __('select_end_date');
							}

						}
						else
						{
							if( app.getSelected.date() == '')
							{
								return __('select_date');
							}
							if( app.getSelected.time() == '')
							{
								return __('select_time');
							}
						}

					}
					else if( step == 'recurring_info' )
					{
						if( app.getSelected.recurringTimesArrFinish() === false )
						{
							return __('select_available_time');
						}
					}
					else if( step == 'information' )
					{
						var hasError = false;
						booking_panel_js.find(".appointment_container_body > [data-step-id='information'] label").each(function()
						{
							var el = $(this).next();
							var required = $(this).is('[data-required="true"]');

							if( el.is('div.iti') )
							{
								el = el.find('input');
							}

							if( el.is('input[type=text], input[type=file], input[type=number], input[type=date], input[type=time], textarea, select') )
							{
								var value = el.val();

								if( el.attr('name') == 'email' )
								{
									var email_regexp = /^(([^<>()\[\]\\.,;:\s@"]+(\.[^<>()\[\]\\.,;:\s@"]+)*)|(".+"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/;
									var checkEmail = email_regexp.test(String(value).toLowerCase());

									if( !( (value == '' && !required) || checkEmail ) )
									{
										el.addClass('input_error');
										hasError = __('email_is_not_valid');

										return;
									}
								}
								else if( el.attr('name') == 'phone' )
								{
									if( !( value == '' && !required || String(value).match(/^\+?[0-9\(\) \-]+$/) ) )
									{
										el.addClass('input_error');
										hasError = __('phone_is_not_valid');

										return;
									}
								}
								else if( required && (value == '' || value == null) )
								{
									if( el.is('select') )
									{
										el.next().find('.select2-selection').addClass('input_error');
									}
									else if( el.is('input[type="file"]') )
									{
										el.next().addClass('input_error');
									}
									else
									{
										el.addClass('input_error');
									}
									hasError = __('fill_all_required');
									return;
								}
							}
							else if( el.is('div') ) // checkboxes or radios
							{
								if( required && el.find('input:checked').length == 0 )
								{
									el.find('input').addClass('input_error');
									hasError = __('fill_all_required');

									return;
								}
							}

						});

						if( hasError )
						{
							return hasError;
						}
					}

					return true;
				},

				fadeInAnimate: function(el, sec, delay)
				{
					sec = sec > 0 ? sec : 150;
					delay = delay > 0 ? delay : 50;

					$(el).hide().each(function (i)
					{
						(function( i, t )
						{
							setTimeout( function ()
							{
								t.fadeIn( (i > 6 ? 6 : i) * sec );
							}, (i > 6 ? 6 : i) * delay );
						})( i, $(this) );
					});
				},

				fadeOutAnimate: function(el, sec, delay)
				{
					sec = sec > 0 ? sec : 150;
					delay = delay > 0 ? delay : 50;

					$(el).each(function (i)
					{
						(function( i, t )
						{
							setTimeout( function ()
							{
								t.fadeOut( (i > 6 ? 6 : i) * sec );
							}, (i > 6 ? 6 : i) * delay );
						})( i, $(this) );
					});
				},

				refreshStepIndexes: function ()
				{
					var index = 1;
					booking_panel_js.find('.appointment_steps_body > .appointment_step_element').each(function()
					{
						if( $(this).css('display') != 'none' )
						{
							$(this).find('.badge').text( index );
							index++;
						}
					});
				},

				_niceScrol: false,
				niceScroll: function ()
				{
					if( !app._niceScrol && !app.isMobileView() )
					{
						booking_panel_js.find(".appointment_container_body").niceScroll({
							cursorcolor: "#e4ebf4",
							bouncescroll: true,
							preservenativescrolling: false
						});

						app._niceScrol = true;

						return;
					}

					if( app.isMobileView() && app._niceScrol )
					{
						app._niceScrol = false;

						booking_panel_js.find(".appointment_container_body").getNiceScroll().remove();

						return;
					}

					if( app._niceScrol )
					{
						booking_panel_js.find(".appointment_container_body").getNiceScroll().resize();
					}
				},

				initDatepicker: function ( el )
				{
					appdatepicker( el[0], {
						formatter: function (input, date, instance)
						{
							var val = date.getFullYear() + '-' + app.zeroPad( date.getMonth() + 1 ) + '-' + app.zeroPad( date.getDate() );
							input.value = app.convertDate( val, 'Y-m-d' );
						},
						startDay: appData.week_starts_on == 'sunday' ? 0 : 1,
						customDays: [__('Sun'), __('Mon'), __('Tue'), __('Wed'), __('Thu'), __('Fri'), __('Sat')],
						customMonths: [__('January'), __('February'), __('March'), __('April'), __('May'), __('June'), __('July'), __('August'), __('September'), __('October'), __('November'), __('December')],
						onSelect: function( input )
						{
							$(input.el).trigger('change');
						}
					});
				},

				refreshGoogleReCaptchaToken: function ()
				{
					if( 'google_recaptcha_site_key' in appData )
					{
						grecaptcha.execute( appData['google_recaptcha_site_key'], { action: google_recaptcha_action }).then(function (token)
						{
							google_recaptcha_token = token;
						});
					}
				},

				isMobileView: function ()
				{
					return window.matchMedia('(max-device-width: 1000px)').matches;
				}

			};

			booking_panel_js.on('click', '.card', function()
			{
				$(this).parent().children('.card_selected').removeClass('card_selected');
				$(this).addClass('card_selected');

				booking_panel_js.find(".next_step").trigger('click');

			}).on('click', '.service_card', function()
			{
				$(this).parent().children('.service_card_selected').removeClass('service_card_selected');
				$(this).addClass('service_card_selected');

				if( appData['skip_extras_step_if_need'] == 'on' )
				{
					if( $(this).data('has-extras') )
					{
						booking_panel_js.find('.appointment_step_element[data-step-id="service_extras"].menu_hidden').slideDown(300, function ()
						{
							app.refreshStepIndexes();
						}).removeClass('menu_hidden');
					}
					else
					{
						booking_panel_js.find('.appointment_step_element[data-step-id="service_extras"]:not(.menu_hidden)').slideUp(300, function ()
						{
							app.refreshStepIndexes();
						}).addClass('menu_hidden');
					}
				}

				booking_panel_js.find(".next_step").trigger('click');

			}).on('click', '.extra_on_off_mode', function (e)
			{
				if( $(e.target).is('.service_extra_quantity_inc, .service_extra_quantity_dec') )
					return;

				if( $(this).hasClass('service_extra_card_selected') )
				{
					$(this).find('.service_extra_quantity_dec').trigger('click');
				}
				else
				{
					$(this).find('.service_extra_quantity_inc').trigger('click');
				}
			}).on('click', '.service_extra_quantity_inc', function()
			{
				var quantity = parseInt( $(this).prev().val() );
				quantity = quantity > 0 ? quantity : 0;
				var max_quantity = parseInt( $(this).prev().data('max-quantity') );

				if( max_quantity !== 0 && quantity >= max_quantity )
				{
					quantity = max_quantity;
				}
				else
				{
					quantity++;
				}

				$(this).prev().val( quantity ).trigger('keyup');
			}).on('click', '.service_extra_quantity_dec', function()
			{
				var quantity = parseInt( $(this).next().val() );
				quantity = quantity > 0 ? quantity : 1;
				quantity--;

				$(this).next().val( quantity ).trigger('keyup');
			}).on('keyup', '.service_extra_quantity_input', function()
			{
				var quantity = parseInt( $(this).val() );
				if( !(quantity > 0) )
				{
					$(this).val('0');
					$(this).closest('.service_extra_card').removeClass('service_extra_card_selected');
				}
				else
				{
					$(this).closest('.service_extra_card').addClass('service_extra_card_selected');
				}
			}).on('click', '.next_step', function()
			{
				var current_step_el	= booking_panel_js.find(".appointment_step_element.active_step"),
					next_step_num	= parseInt( current_step_el.children('span') ) + 1,
					next_step_el	= current_step_el.next('.appointment_step_element');

				while( next_step_el.hasClass('menu_hidden') )
					next_step_el = next_step_el.next();

				var validateion = app.stepValidation( current_step_el.data('step-id') );

				if( validateion !== true )
				{
					app.toast( validateion );
					return;
				}

				if( next_step_el.length > 0 )
				{
					app.toast( false );

					app.loadStep( next_step_el.data('step-id') );

					current_step_el.addClass('selected_step');

					if( app.isMobileView() )
					{
						$('html,body').animate({scrollTop: parseInt($(this).closest('.appointment').offset().top) - 100}, 1000);
					}
				}
				else
				{
					app.confirmAppointment();
				}
			}).on('click', '.prev_step', function()
			{
				var current_step_el	= booking_panel_js.find(".appointment_step_element.active_step"),
					prev_step_num	= parseInt( current_step_el.children('span') ) + 1,
					prev_step_el	= current_step_el.prev('.appointment_step_element');

				while( prev_step_el.hasClass('menu_hidden') )
					prev_step_el = prev_step_el.prev();

				if( prev_step_el.length > 0 )
				{
					current_step_el.removeClass('active_step');
					prev_step_el.addClass('active_step');

					booking_panel_js.find(".next_step,.prev_step").attr('disabled', true);
					booking_panel_js.find('.appointment_container_body > [data-step-id="' + current_step_el.data('step-id') + '"]').fadeOut(200, function()
					{
						booking_panel_js.find(".next_step,.prev_step").attr('disabled', false);
						booking_panel_js.find('.appointment_container_body > [data-step-id="' + prev_step_el.data('step-id') + '"]').fadeIn(200, function ()
						{
							app.niceScroll();
						});
					});
					booking_panel_js.find(".appointment_container_header").text( prev_step_el.data('title') );
				}

				booking_panel_js.find('.next_step').text(__('NEXT STEP'));
			}).on('click', '.calendar_days:not(.calendar_empty_day)[data-date]', function()
			{
				var date = $(this).data('date');

				booking_panel_js.find(".times_list").empty();

				var times = date in app.calendarDateTimes['dates'] ? app.calendarDateTimes['dates'][ date ] : [];
				var time_show_format = app.time_show_format == 2 ? 2 : 1;

				for( var i = 0; i < times.length; i++ )
				{
					var time_badge = '';
					if( times[i]['available_customers'] > 0 && !( 'hide_available_slots' in app.calendarDateTimes && app.calendarDateTimes['hide_available_slots'] == 'on' ) )
					{
						time_badge = '<div class="time_group_num">' + times[i]['available_customers'] + ' / ' + times[i]['max_capacity'] + '</div>';
					}

					booking_panel_js.find(".times_list").append('<div data-time="' + times[i]['start_time'] + '" data-endtime="' + times[i]['end_time'] + '"><div>' + times[i]['start_time_format'] + '</div>' + (time_show_format == 1 ? '<div>' + times[i]['end_time_format'] + '</div>' : '') + time_badge + '</div>');
				}

				booking_panel_js.find(".times_list").scrollTop(0);
				booking_panel_js.find(".times_list").getNiceScroll().resize();

				booking_panel_js.find(".calendar_selected_day").removeClass('calendar_selected_day');

				$(this).addClass('calendar_selected_day');

				booking_panel_js.find(".times_title").text( $(this).data('date-format') );

				if( app.dateBasedService )
				{
					booking_panel_js.find(".times_list > [data-time]:eq(0)").trigger('click');
				}
				else if( app.isMobileView() )
				{
					$('html,body').animate({scrollTop: parseInt(booking_panel_js.find('.time_div').offset().top) - 100}, 1000);
				}
			}).on('click', '.prev_month', function ()
			{
				var month = app.calendarMonth - 1;
				var year = app.calendarYear;

				if( month < 0 )
				{
					month = 11;
					year--;
				}

				app.nonRecurringCalendar( year, month );
			}).on('click', '.next_month', function ()
			{
				var month = app.calendarMonth + 1;
				var year = app.calendarYear;

				if( month > 11 )
				{
					month = 0;
					year++;
				}

				app.nonRecurringCalendar( year, month );
			}).on('click', '.times_list > div', function ()
			{
				booking_panel_js.find('.selected_time').removeClass('selected_time');
				$(this).addClass('selected_time');

				booking_panel_js.find(".next_step").trigger('click');
			}).on('click', '.payment_method', function ()
			{
				booking_panel_js.find(".payment_method_selected").removeClass('payment_method_selected');
				$(this).addClass('payment_method_selected');

				if( $(this).data('payment-type') == 'paypal' || $(this).data('payment-type') == 'stripe' )
				{
					booking_panel_js.find(".hide_on_local").removeClass('hidden').fadeIn(100);
				}
				else
				{
					booking_panel_js.find(".hide_on_local").removeClass('hidden').fadeOut(100);
				}

			}).on('click', '.form-control[type="file"] ~ .form-control', function( e )
			{
				if( !$(e.target).is('a[href]') )
				{
					$(this).prev('.form-control[type="file"]').trigger('click');
				}
			}).on('change', '.form-control[type="file"]', function (e)
			{
				var fileName = e.target.files[0].name;
				$(this).next().text( fileName );
			}).on('keyup change', '[data-step-id=\'information\'] input, [data-step-id=\'information\'] select, [data-step-id=\'information\'] textarea', function ()
			{
				$(this).removeClass('input_error');
			}).on('keyup change', '[data-step-id=\'information\'] input, [data-step-id=\'information\'] select, [data-step-id=\'information\'] textarea', function ()
			{
				if( $(this).attr('type') == 'checkbox' || $(this).attr('type') == 'radio' )
				{
					$(this).parent().parent().find('.input_error').removeClass('input_error');
				}
				else if( $(this).attr('type') == 'file' )
				{
					$(this).next().removeClass('input_error');
				}
				else if( $(this).is('select') )
				{
					$(this).next().find('.input_error').removeClass('input_error');
				}
				else
				{
					$(this).removeClass('input_error');
				}
			}).on('click', '#finish_btn', function ()
			{
				if( $(this).data('redirect-url') == '' )
				{
					location.reload();
				}
				else
				{
					location.href = $(this).data('redirect-url');
				}
			}).on('click', '#start_new_booking_btn', function ()
			{

				booking_panel_js.find('.appointment_finished').fadeOut(100, function()
				{
					booking_panel_js.find('.appointment_steps').fadeIn(100);
					booking_panel_js.find('.appointment_container').fadeIn(100);
				});

				booking_panel_js.find(".selected_step").removeClass('selected_step');
				booking_panel_js.find(".active_step").removeClass('active_step');

				app.calendarDateTimes		= {};
				app.time_show_format		= 1;
				app.calendarYear			= null;
				app.calendarMonth			= null;
				app.paymentWindow			= null;
				app.paymentStatus			= null;
				app.appointmentId			= null;
				app.save_step_data        = {};

				var start_step = booking_panel_js.find(".appointment_step_element:not(.menu_hidden):eq(0)");
				start_step.addClass('active_step');
				app.loadStep(start_step.data('step-id'));

				booking_panel_js.find('.appointment_container_body > [data-step-id]').hide();
				booking_panel_js.find('.appointment_container_body > [data-step-id="' + start_step.data('step-id') + '"]').show();

				booking_panel_js.find('.card_selected').removeClass('card_selected');
				booking_panel_js.find('.service_card_selected').removeClass('service_card_selected');
				booking_panel_js.find('.service_card_selected').removeClass('service_card_selected');

				booking_panel_js.find(".calendar_selected_day").data('date', null);
				booking_panel_js.find(".selected_time").data('time', null);

				app.niceScroll();

			}).on('click', '#add_to_google_calendar_btn', function ()
			{
				window.open( $(this).data('url') );
			}).on('click', '.coupon_ok_btn', function ()
			{
				var coupon = booking_panel_js.find('#coupon').val();
				var staff = app.getSelected.staff();
				var service = app.getSelected.service();
				var service_extras = app.getSelected.serviceExtras();
				var custom_fields = app.getSelected.formData();

				if( coupon == '' )
					return;

				app.ajax('summary_with_coupon', {
					coupon: coupon,
					service: service,
					staff: staff,
					service_extras: service_extras,
					email: custom_fields['data']['email'],
					phone: custom_fields['data']['phone']
				}, function ( result )
				{
					booking_panel_js.find('.discount_price').text( result['discount'] );
					booking_panel_js.find('.sum_price').text( result['sum'] );
					booking_panel_js.find('.deposit_amount_txt').text( result['deposit_txt'] );
					booking_panel_js.find('.add_coupon').addClass('coupon_ok');
					booking_panel_js.find('.giftcard_ok_btn').data('discount_price', result['discount_price']);
					booking_panel_js.find('.discount').removeClass('hidden').hide().fadeIn(200);
					

					if( result['sum_price'] <= 0 )
					{
						booking_panel_js.find('.payment_method_selected').data('payment-type', 'local');
						booking_panel_js.find('.confirm_deposit_body').fadeOut(300, function ()
						{
							booking_panel_js.find('.confirm_sum_body').animate({width: '100%'}, 300);
						});
					}

					if( booking_panel_js.find('.add_giftcard').hasClass('giftcard_ok') )
					{
						booking_panel_js.find('.giftcard_ok_btn').click();
					}

				}, true, function ()
				{
					booking_panel_js.find('.add_coupon').removeClass('coupon_ok');
				});

			}).on('click', '.giftcard_ok_btn', function ()
			{
				var giftcard = booking_panel_js.find('#giftcard').val();
				var staff = app.getSelected.staff();
				var service = app.getSelected.service();
				var service_extras = app.getSelected.serviceExtras();
				var discount_price = booking_panel_js.find('.giftcard_ok_btn').data('discount_price');

				if( giftcard == '' )
					return;

				app.ajax('summary_with_giftcard', {
					giftcard: giftcard,
					service: service,
					staff: staff,
					service_extras: service_extras,
					discount_price: discount_price
				}, function( result )
				{
					if( result['sum_price'] <= 0 )
					{
						booking_panel_js.find('.payment_method_selected').data('payment-type', 'giftcard');
						booking_panel_js.find('.confirm_deposit_body').fadeOut(300, function ()
						{
							booking_panel_js.find('.confirm_sum_body').animate({width: '100%'}, 300);
						});
					}

					booking_panel_js.find('.show_balance').text('Balance: ' + result['printBalance']);

					booking_panel_js.find('.gift_discount_price').mouseover(function(){
						booking_panel_js.find('.show_balance').css('display', 'block');
					}).mouseout(function() {
						booking_panel_js.find('.show_balance').css('display', 'none');
					  });

					booking_panel_js.find('.gift_discount').css('display', 'block');
					booking_panel_js.find('.gift_discount_price').text( result['printSpent'] );
					booking_panel_js.find('.sum_price').text( result['sum'] );
					booking_panel_js.find('.add_giftcard').addClass('giftcard_ok');
				}, true, function ()
				{
					booking_panel_js.find('.add_giftcard').removeClass('giftcard_ok');
				});

			}).on('click', '.try_again_btn', function ()
			{
				booking_panel_js.find('.appointment_finished_with_error').fadeOut(150, function ()
				{
					booking_panel_js.find('.appointment_container_body > [data-step-id="confirm_details"]').fadeIn(150, function ()
					{
						app.niceScroll();
					});
				});

				booking_panel_js.find('.try_again_btn').fadeOut(150, function ()
				{
					booking_panel_js.find('.next_step').fadeIn(150);
					booking_panel_js.find('.prev_step').css('opacity', '1').attr('disabled', false);
				});
			}).on('change', '.day_of_week_checkbox', function ()
			{
				var activeFirstDay = booking_panel_js.find(".times_days_of_week_area .active_day").attr('data-day');

				var dayNum	= $(this).attr('id').replace('day_of_week_checkbox_', ''),
					dayDIv	= booking_panel_js.find(".times_days_of_week_area > [data-day='" + dayNum + "']");

				if( $(this).is(':checked') )
				{
					dayDIv.removeClass('hidden').hide().slideDown(200, function ()
					{
						app.niceScroll();
					}).addClass('active_day');

					if( app.dateBasedService )
					{
						dayDIv.find('.wd_input_time').append('<option>00:00</option>').val('00:00');
					}
				}
				else
				{
					dayDIv.slideUp(200, function ()
					{
						app.niceScroll();
					}).removeClass('active_day');
				}

				booking_panel_js.find(".times_days_of_week_area .active_day .copy_time_to_all").fadeOut( activeFirstDay > dayNum ? 100 : 0 );
				booking_panel_js.find(".times_days_of_week_area .active_day .copy_time_to_all:first").fadeIn( activeFirstDay > dayNum ? 100 : 0 );

				if( booking_panel_js.find('.day_of_week_checkbox:checked').length > 0 && !app.dateBasedService )
				{
					booking_panel_js.find('.times_days_of_week_area').slideDown(200);
				}
				else
				{
					booking_panel_js.find('.times_days_of_week_area').slideUp(200);
				}

				app.calcRecurringTimes();
			}).on('click', '.date_edit_btn', function()
			{
				var tr		= $(this).closest('tr'),
					timeTd	= tr.children('td[data-time]'),
					time	= timeTd.data('time'),
					date1	= tr.children('td[data-date]').data('date');

				timeTd.children('.time_span').html('<select class="form-control time_select"></select>').css({'float': 'right', 'margin-right': '25px', 'width': '120px'}).parent('td').css({'padding-top': '7px', 'padding-bottom': '14px'});

				app.select2Ajax( timeTd.find('.time_select'), 'get_available_times', function()
				{
					return {
						service: app.getSelected.service(),
						extras: app.getSelected.serviceExtras(),
						staff: app.getSelected.staff(),
						date: date1
					}
				});

				$(this).closest('td').children('.data_has_error').remove();
				$(this).remove();

				app.niceScroll();

			}).on('click', '.copy_time_to_all', function ()
			{
				var time = $(this).closest('.active_day').find('.wd_input_time').select2('data')[0];

				if( time )
				{
					var	timeId		= time['id'],
						timeText	= time['text'];

					booking_panel_js.find(".active_day:not(:first)").each(function ()
					{
						$(this).find(".wd_input_time").append( $('<option></option>').val( timeId ).text( timeText ) ).val( timeId ).trigger('change');
					});
				}

			}).on('keyup', '#recurring_times', function()
			{
				var serviceData = app.serviceData;

				if( !serviceData )
					return;

				var repeatType	=	serviceData['repeat_type'],
					start		=	app.getSelected.recurringStartDate(),
					end			=	app.getSelected.recurringEndDate(),
					times		=	$(this).val();

				if( start == '' || times == '' || times <= 0 )
					return;

				var frequency = (repeatType == 'daily') ? booking_panel_js.find('#daily_recurring_frequency').val() : 1;

				if( !( frequency >= 1 ) )
				{
					frequency = 1;
					if( repeatType == 'daily' )
					{
						booking_panel_js.find('#daily_recurring_frequency').val('1');
					}
				}

				var activeDays = {};
				if( repeatType == 'weekly' )
				{
					booking_panel_js.find(".times_days_of_week_area > .active_day").each(function()
					{
						activeDays[ $(this).data('day') ] = true;
					});

					if( $.isEmptyObject( activeDays ) )
					{
						return;
					}
				}
				else if( repeatType == 'monthly' )
				{
					var monthlyRecurringType = booking_panel_js.find("#monthly_recurring_type").val();
					var monthlyDayOfWeek = booking_panel_js.find("#monthly_recurring_day_of_week").val();

					var selectedDays = booking_panel_js.find("#monthly_recurring_day_of_month").select2('val');

					if( selectedDays )
					{
						for( var i = 0; i < selectedDays.length; i++ )
						{
							activeDays[ selectedDays[i] ] = true;
						}
					}
				}

				var cursor = new Date( start );

				var c_times = 0;
				while( (!$.isEmptyObject( activeDays ) || repeatType == 'daily') && c_times < times )
				{
					var weekNum = cursor.getDay();
					var dayNumber = parseInt( cursor.getDate() );
					weekNum = weekNum > 0 ? weekNum : 7;
					var dateFormat = cursor.getFullYear() + '-' + app.zeroPad( cursor.getMonth() + 1 ) + '-' + app.zeroPad( cursor.getDate() );

					if( repeatType == 'monthly' )
					{
						if( ( monthlyRecurringType == 'specific_day' && typeof activeDays[ dayNumber ] != 'undefined' ) || app.getMonthWeekInfo(cursor, monthlyRecurringType, monthlyDayOfWeek) )
						{
							if
							(
								// if is not off day for staff or service
								!( typeof app.globalTimesheet[ weekNum-1 ] != 'undefined' && app.globalTimesheet[ weekNum-1 ]['day_off'] ) &&
								// if is not holiday for staff or service
								typeof app.globalDayOffs[ dateFormat ] == 'undefined'
							)
							{
								c_times++;
							}
						}
					}
					else if
					(
						// if weekly repeat type then only selected days of week...
						( typeof activeDays[ weekNum ] != 'undefined' || repeatType == 'daily' ) &&
						// if is not off day for staff or service
						!( typeof app.globalTimesheet[ weekNum-1 ] != 'undefined' && app.globalTimesheet[ weekNum-1 ]['day_off'] ) &&
						// if is not holiday for staff or service
						typeof app.globalDayOffs[ dateFormat ] == 'undefined'
					)
					{
						c_times++;
					}

					cursor = new Date( cursor.getTime() + 1000 * 24 * 3600 * frequency );
				}

				cursor = new Date( cursor.getTime() - 1000 * 24 * 3600 * frequency );
				end = cursor.getFullYear() + '-' + app.zeroPad( cursor.getMonth() + 1 ) + '-' + app.zeroPad( cursor.getDate() );

				if( !isNaN( cursor.getFullYear() ) )
				{
					booking_panel_js.find('#recurring_end').val( app.convertDate( end, 'Y-m-d' ) );
				}
			}).on('keyup', '#daily_recurring_frequency', app.calcRecurringTimes
			).on('change', '#monthly_recurring_type, #monthly_recurring_day_of_week, #monthly_recurring_day_of_month', app.calcRecurringTimes
			).on('change', '#monthly_recurring_type', function ()
			{
				if( $(this).val() == 'specific_day' )
				{
					booking_panel_js.find("#monthly_recurring_day_of_month").next('.select2').show();
					booking_panel_js.find("#monthly_recurring_day_of_week").next('.select2').hide();
				}
				else
				{
					booking_panel_js.find("#monthly_recurring_day_of_month").next('.select2').hide();
					booking_panel_js.find("#monthly_recurring_day_of_week").next('.select2').show();
				}
			}).on('change', '#recurring_start, #recurring_end', function ()
			{
				var serviceId	= app.getSelected.service(),
					staffId		= app.getSelected.staff(),
					locationId	= app.getSelected.location(),
					startDate	= app.getSelected.recurringStartDate(),
					endDate		= app.getSelected.recurringEndDate();

				if( startDate == '' || endDate == '' )
					return;

				app.ajax('get_day_offs', {
					service: serviceId,
					staff: staffId,
					location: locationId,
					start: startDate,
					end: endDate
				}, function( result )
				{
					app.globalDayOffs = result['day_offs'];
					app.globalTimesheet = result['timesheet'];

					result['disabled_days_of_week'].forEach(function( value, key )
					{
						booking_panel_js.find('#day_of_week_checkbox_' + (parseInt(key)+1)).attr('disabled', value);
					});

					app.calcRecurringTimes();
				});
			}).on('click', '.social_login_facebook, .social_login_google', function ()
			{
				let login_window = window.open($(this).data('href'), 'social_login', 'width=1000,height=700');

				let while_fn = function ()
				{
					var dataType = 'undefined';

					try {
						dataType = typeof login_window.user_data;
					}
					catch (err){}

					if( dataType != 'undefined' )
					{
						if( booking_panel_js.find('#bkntc_input_surname').parent('div').hasClass('hidden') )
						{
							booking_panel_js.find('#bkntc_input_name').val( login_window.user_data['first_name'] + ' ' + login_window.user_data['last_name'] );
						}
						else
						{
							booking_panel_js.find('#bkntc_input_name').val( login_window.user_data['first_name'] );
							booking_panel_js.find('#bkntc_input_surname').val( login_window.user_data['last_name'] );
						}

						booking_panel_js.find('#bkntc_input_email').val( login_window.user_data['email'] );
						login_window.close();
						return;
					}

					if( !login_window.closed )
					{
						setTimeout( while_fn, 1000 );
					}
				}

				while_fn();

			});

			$( window ).resize(function ()
			{
				app.niceScroll();
			});

			var first_step_id = booking_panel_js.find('.appointment_steps_body > .appointment_step_element:not(.menu_hidden)').eq(0).data('step-id');
			app.loadStep(first_step_id);

			app.niceScroll();

			app.fadeInAnimate('.appointment_step_element:not(.menu_hidden)');

			booking_panel_js.find(".appointment_steps_footer").fadeIn(200);

			setTimeout(app.refreshStepIndexes, 450);

			if( 'google_recaptcha_site_key' in appData )
			{
				grecaptcha.ready(function ()
				{
					app.refreshGoogleReCaptchaToken();
				});
			}
		});

	});

})(jQuery);

