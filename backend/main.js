const { register } = require('./src/libcal');
const client = require('./src/redis-instance');

const express = require('express');
const bodyParser = require('body-parser');
const cors = require('cors');
const cron = require('node-cron');

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

/*** Express API ***/
const app = express();
app.use(bodyParser.json()); 
app.use(cors());
app.use(bodyParser.urlencoded({ extended: true }));
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
        client.sadd(email+':triggers', event_id); // add trigger, for server restarts
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
        client.smembers(email+':reservations', (err, reservations) => {
            reservations.map(sanitizeReservations(email, startdts));
            client.smembers(email+':triggers', (err, triggers) => {
                return res.json({
                    reservations,
                    triggers,
                    startdts
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

app.post('/update_account', (req, res) => {
    if (!req.body.fname) return res.status(500).send('No fname supplied');
    if (!req.body.lname) return res.status(500).send('No lname supplied');
    if (!req.body.email) return res.status(500).send('No email supplied');
    if (!req.body.phone) return res.status(500).send('No phone supplied');
    if (!req.body.q1) return res.status(500).send('No student no. supplied');
    console.log('updating account' + req.body.email);
    client.HMSET(req.body.email, req.body);
    res.json({'message': 'Account updated.'});
})

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
    client.HMSET('event_startdts', { [event_id]: startdt });
    cron.schedule(`${sec} ${min} ${hr} ${day} ${month} *`, () => {
        console.log('trigger triggered:',event_id,email,', start date =',
            new Date(startdt));
        registration(event_id, email);
        client.srem(email+':triggers', event_id);
    });
}

function setTrigger(email) {
    return (trigger) => {
        client.hget('event_startdts',trigger, (err, startdt) => {
            if (err) return console.warn('Error in event_startdts lookup.', err)
            if (!startdt) return console.warn('No startdt found!')

            // remove outdated triggers
            const today = new Date().setDate(new Date().getDate()+4);
            const outdated_trigger = new Date(startdt) < today;
            if (outdated_trigger) return client.srem(email+':triggers', trigger)

            scheduleReservation(trigger, email, startdt);
        });
    }
}

function configureTriggers(trigger_account) {
    const email = trigger_account.split(':')[0];
    client.smembers(trigger_account, (err, triggers) => {
        if (err) return console.warn('`smembers` failed for '+trigger_account)
        triggers.map(setTrigger(email));
    });
}

function sanitizeReservations(email, startdts) {
    return reservation => {
        if (!(reservation in startdts)) client.srem(email+':reservations', reservation)
        const startdt = startdts[reservation];
        // check if event already passed
        if (new Date(startdt) < new Date()) {
            client.srem(email+':reservations', reservation);
            console.log('sanitized passed event: ', reservation, startdt)
        }
    };
}

function sanitizeStartdts() {
    client.hgetall('event_startdts', (err, startdts) => {
        if (err) return console.warn('event_startdts retrieval err', err);
        let cnt = 0;
        Object.keys(startdts).forEach(event_id => {
            const startdt = startdts[event_id];
            if (new Date(startdt) < new Date()) {
                client.HDEL('event_startdts', event_id);
                cnt ++;
            }
        })
        console.log(`Sanitized ${cnt} start dates.`)
    });
}

/** Setup triggers **/
servertime = new Date();
localtime = new Date(new Date()
    .toLocaleString("nl-NL", { timeZone: "Europe/Amsterdam" }));
const timediff = servertime.getHours() - localtime.getHours();
console.log('TIMEZONE CORRECTION', 'server time:', servertime.toString(),
    'local time: ', localtime.toString(), ' >> diff=', timediff);

console.log('Get all `*:triggers` keys. Setting triggers...')
client.keys('*:triggers', (err, trigger_accounts) => {
    if (err) return console.warn('Redis *:triggers lookup failed')
    trigger_accounts.map(configureTriggers);
});

/** Sanitize startdts **/
sanitizeStartdts();

/** Express server **/
const PORT = process.env.PORT || 3001;
app.listen(PORT, () =>
    console.log(`Example app listening on port ${PORT}!`),
);
process.on("exit", function(){
    client.quit();
});
