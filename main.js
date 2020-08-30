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
const beginurl = 'https://libcal.rug.nl/ajax/event/begin/3496371'; // POST
// get `id`

const cancelurl = 'https://libcal.rug.nl/ajax/event/cancel/2079853?w=0&c=e6069603f6e88b9f24be0d16381b51f9&rm=0';
// request.post(cancelurl,
//     {
//         form: {
//             w: 0,
//             c: 'e6069603f6e88b9f24be0d16381b51f9',
//             rm: 0
//         }
//     }
// )



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
const post = bent(`https://libcal.rug.nl/ajax/event/`,
    'POST', 'json', 200);
async function beginRegistration( event_id) {
    const res = await post(`begin/${event_id}`, {}, {
        'Referer': `https://libcal.rug.nl/event/${event_id}`
    });
    return res;
    return rp.post(`https://libcal.rug.nl/ajax/event/begin/${event_id}`)
        .then((err, httpResponse, body) => {
            console.log(err, httpResponse, body);
        })
        .catch(function (err) {
            console.warn(err);
        });
}

function register(id, event_id, user) {
    const registrationurl = `https://libcal.rug.nl/ajax/event/submit/${event_id}`;
    request.post(registrationurl, 
        {
            form: {
                'id': id,
                'formData[event_id]': event_id,
                'formData[cal_id]': '7564',
                'formData[wl]': '0',
                'formData[qcount]': '1',
                'formData[fid]': '5455',
                ...user.details
            }
        },
        function(err, httpResponse, body) {
            console.log(body);
        })
}

function getEvents() {
    jsonpClient(eventsurl, (err, dd) => {
        console.log(err, dd);
    })
}

console.log('end');
// const res = beginRegistration(3491811)
//     .then(res => {
//         console.log(res.id)
//     })
//     .catch(console.warn);
// console.log(res);
