const bent = require('bent');
const formurlencoded = require('form-urlencoded').default;

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

const post = bent(`https://libcal.rug.nl/ajax/event/`,
    'POST', 'json', 200);
async function beginRegistration(event_id) {
    return await post(`begin/${event_id}`, {}, {
        'Referer': `https://libcal.rug.nl/event/${event_id}`
    });
}

async function performRegistration(id, event_id, user) {
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

async function register(event_id, user) {
    return beginRegistration(event_id)
        .then(res => {
            console.log(res);
            console.log(res.id);
            return res.id;
        }).catch(console.warn)
        .then(seat_id => {
            return performRegistration(seat_id, event_id, user);
        })
        .then(res => {
            console.log(res);
            console.log(res.bookingId);
            return res;
        })
        .catch(err => {
            console.warn(err.message);
            err.text().then(console.log).catch(console.warn);
        });
    
}

register(3491811, me).then(() => {
    console.log('Registration completed.');
}).catch(console.warn);