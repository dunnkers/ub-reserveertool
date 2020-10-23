const bent = require('bent');
const formurlencoded = require('form-urlencoded').default;

const post = bent(`https://libcal.rug.nl/ajax/event/`,
'POST', 'json', 200);

async function beginRegistration(event_id) {
    return await post(`begin/${event_id}`, {}, {
        'Referer': `https://libcal.rug.nl/event/${event_id}`
    });
};

async function performRegistration(id, event_id, user) {
    return await post(`submit/${event_id}`, formurlencoded({
        id,
        formData: {
            event_id,
            'cal_id': '7564',
            'wl': '0',
            'qcount': '1',
            'fid': '5455',
            ...user
        }
    }), {
        'Content-Type': 'application/x-www-form-urlencoded',
        'Referer': `https://libcal.rug.nl/event/${event_id}`
    });
};

module.exports.register = async function register(event_id, user) {
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
};