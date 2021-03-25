const bent = require('bent');
const formurlencoded = require('form-urlencoded').default;

const LIBCAL = {
    cal_id: '7564',
    fid: '5455',
    domain: 'libcal.rug.nl'
};

async function beginRegistration(event_id, libcal=LIBCAL) {
    const post = bent(`https://${libcal['domain']}/ajax/event/`, 'POST', 'json', 200);
    return await post(`begin/${event_id}`, {}, {
        'Referer': `https://${libcal['domain']}/event/${event_id}`
    });
};

async function performRegistration(id, event_id, user, libcal=LIBCAL) {
    const post = bent(`https://${libcal['domain']}/ajax/event/`, 'POST', 'json', 200);
    let extra = {
    };
    switch (libcal['domain']) {
        case 'libcal-jur.rug.nl':
        case 'libcal-arts.rug.nl':
            extra['q2'] = 'Rechten';
            extra['q3'] = {
                '': 'Yes'
            };
            console.log('adding extra question information for JUR/ARTS.');
        default:
            break;
    }
    
    return await post(`submit/${event_id}`, formurlencoded({
        id,
        formData: {
            event_id,
            'cal_id': libcal['cal_id'],
            'wl': '0',
            'qcount': '1',
            'fid': libcal['fid'],
            ...extra,
            ...user
        }
    }), {
        'Content-Type': 'application/x-www-form-urlencoded',
        'Referer': `https://${libcal['domain']}/event/${event_id}`
    });
};

module.exports.register = async function register(event_id, user, libcal=LIBCAL) {
    return beginRegistration(event_id, libcal)
        .then(res => {
            console.log('Reserved a seat.', res)
            return res.id; // seat. { id: 'rjkeSd', seats: 120, seatsTaken: 119 }
        })
        .then(seat_id => performRegistration(seat_id, event_id, user, libcal))
        // returns booking. e.g. { fullRegistration: x, bookingId: y, totalCost: 0}
        .catch(err => {
            console.warn(err);
            if (!err.text) throw err;
            return err.text().then(text => {
                throw text;
            })
        });
};