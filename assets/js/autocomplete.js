
let current_location = [
    {
        FullName: 'Pakistan (300)'
    },
    {
        FullName: 'UAE (632)'
    },
    {
        FullName: 'India (542)'
    },
    {
        FullName: 'Saudi Arabia (321)'
    },
    {
        FullName: 'Sharjah (321)'
    },
    {
        FullName: 'Egypt (31)'
    },
    {
        FullName: 'Turkey (201)'
    },
    {
        FullName: 'Ajman (21)'
    }
];

let company = [
    {
        FullName: 'First Abu Dhabi Bank (300)'
    },
    {
        FullName: 'Emirates Group (542)'
    },
    {
        FullName: 'Emaar Properties (321)'
    },
    {
        FullName: 'DP World (321)'
    },
    {
        FullName: 'Mashreq (31)'
    },
    {
        FullName: 'Beauty and Hair Salon (201)'
    },
    {
        FullName: 'Travel and Tourism (21)'
    }
];

let job_title = [
    {
        FullName: 'Sales Job (300)'
    },
    {
        FullName: 'Medical Profession (632)'
    },
    {
        FullName: 'Lawyers (542)'
    },
    {
        FullName: 'Chief Financial Officers (321)'
    },
    {
        FullName: 'Civil Engineers (321)'
    },
    {
        FullName: 'Bankers (31)'
    },
    {
        FullName: 'Chief Executive Officers (201)'
    },
    {
        FullName: 'Real Estate Profession (21)'
    }
];

let skills = [
    {
        FullName: 'Project management (300)'
    },
    {
        FullName: 'Mobile application development (632)'
    },
    {
        FullName: 'Cloud computing (542)'
    },
    {
        FullName: 'Artificial intelligence (321)'
    },
    {
        FullName: 'Sales leadership (321)'
    },
    {
        FullName: 'Analytical reasoning (31)'
    },
    {
        FullName: 'Problem solving (201)'
    },
    {
        FullName: 'People management (21)'
    }
];

let deep_skills = [
    {
        FullName: 'POSTGRESQL (300)'
    },
    {
        FullName: 'UNIX (632)'
    },
    {
        FullName: 'QuickBooks (542)'
    },
    {
        FullName: 'Zoho Books (321)'
    },
    {
        FullName: 'Excel (321)'
    },
    {
        FullName: 'Sketching (31)'
    },
    {
        FullName: 'Agile Modeling (201)'
    },
    {
        FullName: 'Slack (21)'
    }
];

let year_exp = [
    {
        FullName: '1-2 Years (300)'
    },
    {
        FullName: '2-3 Years (632)'
    },
    {
        FullName: '3-4 Years (542)'
    },
    {
        FullName: '4-5 Years (321)'
    },
    {
        FullName: '5-6 Years (321)'
    },
    {
        FullName: '6-7 Years (321)'
    },
    {
        FullName: '7-8 Years (321)'
    }
];

$('#location').autocomplete({
    minChars: 1,
    delay: 500,
    autofocus: true,
    html: true,
    source: [...current_location.map(el => {
        return {
        label: el.FullName,
        value: el.FullName,
        data: el
        }
    })],
    select: function (e, { item }) {
        // on select event
        console.log(item);
    },
    focus: function (e, ui) { e.preventDefault(); }
})
.on('click focus', function () {
    $(this).autocomplete('search', " ");
});

$('#company').autocomplete({
    minChars: 1,
    delay: 500,
    autofocus: true,
    html: true,
    source: [...company.map(el => {
        return {
        label: el.FullName,
        value: el.FullName,
        data: el
        }
    })],
    select: function (e, { item }) {
        // on select event
        $('ul.company').prepend(`
            <li><input class="mr-1" type="checkbox" checked>${item.data.FullName}</li>
        `);
        setTimeout(() => $('#company').val(''), 50);
    },
    focus: function (e, ui) { e.preventDefault(); }
})
.on('click focus', function () {
    $(this).autocomplete('search', " ");
});

$('#job_title').autocomplete({
    minChars: 1,
    delay: 500,
    autofocus: true,
    html: true,
    source: [...job_title.map(el => {
        return {
        label: el.FullName,
        value: el.FullName,
        data: el
        }
    })],
    select: function (e, { item }) {
        // on select event
        $('ul.job_title').prepend(`
            <li><input class="mr-1" type="checkbox" checked>${item.data.FullName}</li>
        `);
        setTimeout(() => $('#job_title').val(''), 50);
    },
    focus: function (e, ui) { e.preventDefault(); }
})
.on('click focus', function () {
    $(this).autocomplete('search', " ");
})

$('#skills').autocomplete({
    minChars: 1,
    delay: 500,
    autofocus: true,
    html: true,
    source: [...skills.map(el => {
        return {
        label: el.FullName,
        value: el.FullName,
        data: el
        }
    })],
    select: function (e, { item }) {
        // on select event
        $('ul.skills').prepend(`
            <li><input class="mr-1" type="checkbox" checked>${item.data.FullName}</li>
        `);
        setTimeout(() => $('#skills').val(''), 50);
    },
    focus: function (e, ui) { e.preventDefault(); }
})
.on('click focus', function () {
    $(this).autocomplete('search', " ");
})

$('#deep_skills').autocomplete({
    minChars: 1,
    delay: 500,
    autofocus: true,
    html: true,
    source: [...deep_skills.map(el => {
        return {
        label: el.FullName,
        value: el.FullName,
        data: el
        }
    })],
    select: function (e, { item }) {
        // on select event
        $('ul.deep_skills').prepend(`
            <li><input class="mr-1" type="checkbox" checked>${item.data.FullName}</li>
        `);
        setTimeout(() => $('#deep_skills').val(''), 50);
    },
    focus: function (e, ui) { e.preventDefault(); }
})
.on('click focus', function () {
    $(this).autocomplete('search', " ");
})

$('#year_exp').autocomplete({
    minChars: 1,
    delay: 500,
    autofocus: true,
    html: true,
    source: [...year_exp.map(el => {
        return {
            label: el.FullName,
            value: el.FullName,
            data: el
        }
    })],
    select: function (e, { item }) {
        // on select event
        $('ul.year_exp').prepend(`
            <li><input class="mr-1" type="checkbox" checked>${item.data.FullName}</li>
        `);
        setTimeout(() => $('#year_exp').val(''), 50);
    },
    focus: function (e, ui) { e.preventDefault(); }
})
.on('click focus', function () {
    $(this).autocomplete('search', " ");
})