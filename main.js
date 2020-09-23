const bent = require('bent');
const formurlencoded = require('form-urlencoded').default;
const redis = require('redis');
const express = require('express');
const bodyParser = require('body-parser');
const cors = require('cors');
const cron = require('node-cron');
const gszv = require('./gszvgolfbreker')

const app = express();
app.use(bodyParser.json()); 
app.use(cors());
app.use(bodyParser.urlencoded({ extended: true }));

const post = bent(`https://libcal.rug.nl/ajax/event/`,
    'POST', 'json', 200);
async function beginRegistration(event_id) {
    return await post(`begin/${event_id}`, {}, {
        'Referer': `https://libcal.rug.nl/event/${event_id}`
    });
}

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

async function registration(event_id, email) {
    console.log(`performing registration for user ${email}, event ${event_id}`)
    return new Promise((resolve, reject) => {
        client.hgetall(email, (err, user) => {
            if (!user) reject('no account in db');
            resolve(user);
        });
    }).then(user => {
        client.sadd(email+':reservations', event_id);
        return register(event_id, user);
    });
}

const host = process.env.REDIS_IP || 'localhost';
const client = redis.createClient(6379, host, {
    password: process.env.REDIS_ROOT_PASSWORD || null
});
client.on('error', (err) => console.error('ERR:REDIS:', err));

servertime = new Date();
localtime = new Date(new Date()
    .toLocaleString("nl-NL", { timeZone: "Europe/Amsterdam" }));
const timediff = servertime.getHours() - localtime.getHours();
console.log('TIMEZONE CORRECTION', 'server time:', servertime.toString(),
    'local time: ', localtime.toString(), ' >> diff=', timediff);
function scheduleReservation(event_id, email, startdt) {
    // 4 days in advance
    let date = new Date(startdt);
    date.setDate(date.getDate() - 4);
    date.setSeconds(date.getSeconds() + 1);

    // node-cron dep tz-offset out of date so timezones not working correctly.
    date.setHours(date.getHours() + timediff);
    
    // compute cron date format
    const sec = date.getSeconds();
    const min = date.getMinutes();
    const hr = date.getHours();
    const day = date.getDate();
    const month = date.getMonth() + 1; // begins with 0, cron needs 1.
    
    // set CRON
    console.log(`Setting CRON: ${sec} ${min} ${hr} ${day} ${month} *`,
        `(date=${date}, event=${event_id}, email=${email})`);
    client.sadd(email+':triggers', event_id);
    client.HMSET('event_startdts', { [event_id]: startdt });
    cron.schedule(`${sec} ${min} ${hr} ${day} ${month} *`, () => {
        console.log('trigger triggered:',event_id,email);
        registration(event_id, email);
        client.srem(email+':triggers', event_id);
    });
}

console.log('Get all `*:triggers` keys. Setting triggers...')
client.keys('*:triggers', (err, trigger_accounts) => {
    for (trigger_account of trigger_accounts) {
        const email = trigger_account.split(':')[0];
        client.smembers(trigger_account, (err, triggers) => {
            for (trigger of triggers) {
                client.hget('event_startdts',trigger, (err, startdt) => {
                    scheduleReservation(trigger, email, startdt);
                });
            }
        });

    }
});

app.post('/cancel_reservation', (req, res) => {
    if (!req.body.email) return res.status(500).send('No email supplied')
    if (!req.body.event_id) return res.status(500).send('No event id supplied')

    const {event_id, email} = req.body;
    console.log('removing trigger ' + event_id + ' for user ' + email);
    client.srem(email+':triggers', event_id);
    res.json({'message': 'Removed trigger'});
});

app.post('/register', (req, res) => {
    if (!req.body.email) return res.status(500).send('No email supplied')
    if (!req.body.event_id) return res.status(500).send('No event id supplied')
    
    const {fully_booked, not_open, startdt, event_id, email} = req.body;
    console.log('registering ' + email + ' for event ' + event_id);
    if (fully_booked === 'true') return res.json({'message': 'Fully booked.'});
    if (not_open === 'true') {
        console.log('not yet open.');
        scheduleReservation(event_id, email, startdt);
        res.json({'message': 'Scheduled registration!'});
    } else {
        console.log('already open.');
        registration(event_id, email).then(res => {
            res.json({'message': 'Made registration.'});
        }).catch(err => res.status(500).send(err))
    }
});

app.post('/reservations', (req, res) => {
    if (!req.body.email) return res.status(500).send('No email supplied')
    const { email } = req.body;
    client.hgetall('event_startdts', (err, startdts) => {
        client.smembers(email+':reservations', (err, value) => {
            client.smembers(email+':triggers', (err, triggers) => {
                return res.json({
                    'reservations':value,
                    'triggers':triggers,
                    'startdts': startdts
                });
            });
        });
    });
});

app.post('/identify', (req, res) => {
    if (!req.body.email) return res.status(500).send('No email supplied');
    client.hgetall(req.body.email, (err, value) => {
        console.log('logged in '+req.body.email);
        return res.json(value);
    });
});

app.post('/register_account', (req, res) => {
    if (!req.body.formData) return res.status(500).send('No form data supplied');
    if (!req.body.formData.fname) return res.status(500).send('No fname supplied');
    if (!req.body.formData.lname) return res.status(500).send('No lname supplied');
    if (!req.body.formData.email) return res.status(500).send('No email supplied');
    if (!req.body.formData.phone) return res.status(500).send('No phone supplied');
    if (!req.body.formData.q1) return res.status(500).send('No student no. supplied');
    console.log('registering account' + req.body.formData.email);
    client.HMSET(req.body.formData.email, req.body.formData);
    res.json({'message': 'Account created.'});
})

app.listen(3001, () =>
    console.log(`Example app listening on port 3001!`),
);
process.on("exit", function(){
    client.quit();
});
