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
            console.log('Reserved a seat.', res)
            return res.id; // seat. { id: 'rjkeSd', seats: 120, seatsTaken: 119 }
        })
        .then(seat_id => performRegistration(seat_id, event_id, user))
        // returns booking. e.g. { fullRegistration: x, bookingId: y, totalCost: 0}
        .catch(err => {
            if (!err.text) throw err;
            return err.text().then(text => {
                throw text;
            })
        });
};