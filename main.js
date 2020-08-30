const jsonpClient = require('jsonp-client');
const request = require('request');
const querystring = require('querystring');
const rp = require('request-promise-native');

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
// get `id`

const cancelurl = 'https://libcal.rug.nl/ajax/event/cancel/2079853?w=0&c=e6069603f6e88b9f24be0d16381b51f9&rm=0';


class User {
    constructor(details) {
        this.details = details;
    }
}

let me = new User({
    'formData[fname]': 'Jeroen',
    'formData[lname]': 'Overschie',
    'formData[email]': 'j.g.s.overschie@student.rug.nl',
    'formData[phone]': '+31650998154',
    'formData[q1]': 's2995697'
})

const bent = require('bent');
const formurlencoded = require('form-urlencoded').default;

const post = bent(`https://libcal.rug.nl/ajax/event/`,
    'POST', 'json', 200);
async function beginRegistration( event_id) {
    return await post(`begin/${event_id}`, {}, {
        'Referer': `https://libcal.rug.nl/event/${event_id}`
    });
}

async function register(id, event_id, user) {
    return await post(`submit/${event_id}`, formurlencoded({
        'id': id,
        'formData[event_id]': event_id,
        'formData[cal_id]': '7564',
        'formData[wl]': '0',
        'formData[qcount]': '1',
        'formData[fid]': '5455',
        ...user.details
    }), {
        'Content-Type': 'application/x-www-form-urlencoded',
        'Referer': `https://libcal.rug.nl/event/${event_id}`
    });
}

function getEvents() {
    jsonpClient(eventsurl, (err, dd) => {
        console.log(err, dd);
    })
}

console.log('end');
const res = beginRegistration(3491811)
    .then(res => {
        console.log(res);
        console.log(res.id)
    })
    .catch(console.warn);
const res = register('ExmRb6', 3491811, me)
    .then(res => {
        console.log(res);
        console.log(res.bookingId);
    })
    .catch(err => {
        console.warn(err.message);
        err.text().then(console.log).catch(console.warn);
    });
