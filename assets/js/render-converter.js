// date formate
$.views.converters("format", date => moment(date).format('MMM D, YYYY'));
$.views.converters("date", date => moment(date).format('YYYY-MM-DD'));
$.views.converters("day", date => moment(date).format('YYYY-MM-DD, ddd'));
// date time from now
$.views.converters("fromNow", date => moment(date).fromNow());
// status
$.views.converters("status", value => value == 'Yes' ? 'success' : 'danger' );
// is ready
$.views.converters("isCreated", value => value ? '<span class="badge badge-success-inverted">Ready</span>' : '<span class="badge badge-primary-inverted">Created</span>' );
$.views.converters("time", value => value ? moment(value).format('hh:mm:A') : '' );
$.views.converters("isSelected", value => value ? '' : 'selected' );
$.views.converters("isActive", value => value ? 'active' : 'inactive' );
// yes or no
$.views.converters("yesOrNo", value => value ? 'Yes' : 'No' );
// currency
$.views.converters("numberWithCommas", num => num ? numberWithCommas(num) : '0.0' );
$.views.converters("currency", num => formatQuantity(num));
// isEmpty
$.views.converters("isEmpty", value => value ? value.toFixed(2) : '0.0' );
// ready to delivery
$.views.converters("timeDiff", function(date1, date2) {
    if (date1 && date2) {
        var a = moment(date1); //todays date
        var b = moment(date2); // another date
        return a.diff(b, 'minutes');
    } else {
        return 0;
    }
})

// linkToCustomer
$.views.converters("linkToCustomer", 
    (cust) => `<a class="primary bold" href="${site.base_url}sales/add?customer=${cust.split('$')[0].trim()}">
                    ${cust.split('$').length > 1 ? cust.split('$')[1].trim() : cust.split('$')[0].trim()}
                </a>`);

// currencyFormat
$.views.converters("currencyFormat", value => currencyFormat(value));
// formatQuantity
$.views.converters("formatQuantity", value => formatQuantity(value));
// checkbox
$.views.converters("checkbox", value => checkbox(value));
// fld
$.views.converters("fld", value => fld(value));
// row_status
$.views.converters("row_status", value => row_status(value));
// pay_status
$.views.converters("pay_status", value => pay_status(value));
// leave_status
$.views.converters("leave_status", value => leave_status(value));
// leave_border
$.views.converters("leave_border", value => leave_border(value));
// avatar
$.views.converters("avatar", value => avatar(value));
// attachment
$.views.converters("attachment", value => attachment(value));
// currencyFormat
$.views.converters("printIcon", id => `<a style="font-size: medium;color: #673AB7;" href="${site.base_url}/sales/viewInvoice/${id}"><i class="fa os-icon os-icon-printer"></i></a>`);
// role
$.views.converters("privilege", id => id == 0 ? 'User' : 'Super Administrator');
// attn type
$.views.converters("attendance_type", id => id == 0 ? 'Passowrd' : 'Fingerprint');
// priority 1
$.views.converters("priority_active", val => Number(val) == 1 ? 'selected_step active_step' : '');

// attn type
$.views.converters("compare_time_g", (d1, d2) => d1 == null ? 'warning' : (d1 > d2  ? 'primary' : 'danger'));
$.views.converters("compare_time_l", (d1, d2) => d1 == null ? 'warning' : (d1 < d2  ? 'primary' : 'danger'));

// is yes/no
$.views.converters("isTrue", el => el != 0 ? `<div class="label label-success">Yes</div>` : `<div class="label label-warning">No</div>` );