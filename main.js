const jsonpClient = require('jsonp-client');
const request = require('request');
const querystring = require('querystring');

const cal_id = 7564;
const eventsparams = {
    c: cal_id,
    date: '0000-00-00',
    perpage: 96,
    page: 1,
    audience: 'undefined',
    cats: '',
    camps: '',
    inc: 0,
    callback: 'get_calendar'
}
const endpoint_events = 'https://libcal.rug.nl/ajax/calendar/list';
const eventsurl = `${endpoint_events}?${querystring.stringify(eventsparams)}`
const beginurl = 'https://libcal.rug.nl/ajax/event/begin/3496371'; // POST
// get `id`

const cancelurl = 'https://libcal.rug.nl/ajax/event/cancel/2079853?w=0&c=e6069603f6e88b9f24be0d16381b51f9&rm=0';
request.post(cancelurl,
    {
        form: {
            w: 0,
            c: 'e6069603f6e88b9f24be0d16381b51f9',
            rm: 0
        }
    }
)

const registrationurl = 'https://libcal.rug.nl/ajax/event/submit/3496028';
request.post(registrationurl, 
    {
        form: {
            'id': 'kLNJ1Y',
            'formData[event_id]': '3496028',
            'formData[cal_id]': '7564',
            'formData[wl]': '0',
            'formData[qcount]': '1',
            'formData[fid]': '5455',
            'formData[fname]': 'Jeroen',
            'formData[lname]': 'Overschie',
            'formData[email]': 'j.g.s.overschie@student.rug.nl',
            'formData[phone]': '+31650998154',
            'formData[q1]': 's2995697'
        }
    }
)
jsonpClient(eventsurl, (err, dd) => {
    console.log(dd);
})
// JSONP

// fetch(url).then(function (response) {
// 	// The API call was successful!
// 	return response.jsonp();
// }).then(function (data) {
// 	// This is the JSON from our response
// 	console.log(data);
// }).catch(function (err) {
// 	// There was an error
// 	console.warn('Something went wrong.', err);
// });

