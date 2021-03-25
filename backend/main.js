const { register } = require('./src/libcal');
const client = require('./src/redis-instance');
const { regloop, tryreg } = require('./src/regloop');

const express = require('express');
const bodyParser = require('body-parser');
const cors = require('cors');
const cron = require('node-cron');


const LIBCAL = {
    '7736': { //Heymans
        'cal_id': '7736',
        'fid': '5517',
        'domain': 'libcal-gmw.rug.nl',
        'timing': 14
    },
    '7564': { //UB
        'cal_id': '7564',
        'fid': '5455',
        'domain': 'libcal.rug.nl',
        'timing': 4
    },
    '7814': { //Harmonie ARTS
        'cal_id': '7814',
        'fid': '5569',
        'domain': 'libcal-arts.rug.nl',
        'timing': 2
    },
    '7666': { //Harmonie JUR
        'cal_id': '7666',
        'fid': '5503',
        'domain': 'libcal-jur.rug.nl',
        'timing': 2
    },
    '7836': { //Oude Boteringe 18
        'cal_id': '7836',
        'fid': '5503',
        'domain': 'libcal-jur.rug.nl',
        'timing': 7
    },
    '7770': { //Duisenberg
        'cal_id': '7770',
        'fid': '5558',
        'domain': 'libcal-feb.rug.nl',
        'timing': 7
    }
};

async function registration(event_id, email, libcal) {
    return new Promise((resolve, reject) => {
        client.hgetall(email, (err, user) => {
            if (!user) reject('no account in db');
            resolve(user);
        });
    })
    .then(user => {
        return register(event_id, user, libcal);
    })
    .then(res => {
        if ('fullRegistration' in res && res.fullRegistration) {
            return res;
        } else {
            throw 'Unknown registration error.'
        }
    })
    .then(res => {
        client.sadd(email+':reservations', event_id);
        return res;
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
    client.HMSET('event_startdts', { [event_id]: startdt });
    console.log('registering ' + email + ' for event ' + event_id);
    if (fully_booked === 'true') {
        return res.status(500).json({
            errortype: 'REG_FAIL',
            err: 'Registrations were already fully booked.'
        });
    }
    let libcal = LIBCAL['7564']; // UB
    if (req.body.cal_id && req.body.fid && req.body.domain) {
        libcal = {
            cal_id: req.body.cal_id,
            fid: req.body.fid,
            domain: req.body.domain
        };
        // [TODO]: heymans-compat - save libcal object to Redis.
    }
    const cal_id = libcal['cal_id'];
    client.HMSET('event_calids', { [event_id]: cal_id });

    const force = req.body.force && req.body.force === 'true';
    console.log('req.body.force', req.body.force);
    if (force) console.log('Using FORCE to register.');
    if (not_open === 'true' && !force) {
        console.log('not yet open.');
        client.sadd(email+':triggers', event_id); // add trigger, for server restarts
        scheduleReservation(event_id, email, startdt, cal_id);
        res.json({'message': 'Registration scheduled!'});
        // [TODO]: heymans-compat - add 'cal_id:trigggers' mapping.
    } else {
        console.log('already open. libcal=', libcal);
        registration(event_id, email, libcal).then(result => {
            console.log('registration successful: ', result);
            res.json({'message': 'Registration made!', ...result});
        }).catch(err => {
            console.warn(err);
            res.status(500).json({
                errortype: 'REG_FAIL',
                err: err.message ? err.message : err
            });
        })
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

app.post('/regloop', (req, res) => {
    if (!req.body.email) return res.status(500).send('No email supplied')
    if (!req.body.event_id) return res.status(500).send('No event id supplied')
    if (!req.body.startdt) return res.status(500).send('No startdt supplied')
    const {event_id, email, startdt} = req.body;
    console.log('setting regloop for ', email, event_id, startdt)
    client.HMSET('event_startdts', { [event_id]: startdt });
    client.sadd(email+':regloops', event_id);
    res.json({'message': 'Regloop set.'});
})

app.post('/add_account', (req, res) => {
    const { email } = req.body;
    if (!email) return res.status(500).send('No email supplied');
    client.HMSET(email, { email: email });
    res.json({'message': 'Added account.'});
})

function scheduleReservation(event_id, email, startdt, cal_id) {
    if (!LIBCAL.hasOwnProperty(cal_id)) return console.warn('Invalid cal_id', cal_id);
    const libcal = LIBCAL[cal_id];
    const timing = libcal.hasOwnProperty('timing') ? 
        libcal['timing'] : 4;

    // 4 days in advance
    let date = new Date(startdt);
    date.setDate(date.getDate() - timing);
    date.setSeconds(date.getSeconds() + 1);

    // node-cron dep tz-offset out of date so timezones not working correctly.
    date.setHours(date.getHours() + timediff);
    
    // NODE >= 12 ONLY FOR SOME REASON
    if (!date.getSeconds()) { // seconds are NaN
        console.warn('skipping CRON for ', startdt, event_id, email,
            '(invalid date)')
        return;
    }

    // compute cron date format
    const sec = date.getSeconds();
    const min = date.getMinutes();
    const hr = date.getHours();
    const day = date.getDate();
    const month = date.getMonth() + 1; // begins with 0, cron needs 1.
    
    // set CRON
    console.log(`Setting CRON: ${sec} ${min} ${hr} ${day} ${month} *`,
        `(date=${date}, event=${event_id}, email=${email})`);
    cron.schedule(`${sec} ${min} ${hr} ${day} ${month} *`, () => {
        console.log('trigger triggered:',event_id,email,', start date =',
            new Date(startdt));
        registration(event_id, email, libcal).then(result => {
            console.log('trigger succeeded ', result)
            client.srem(email+':triggers', event_id);
        }).catch(err => {
            console.warn('trigger reservation failed ', err);
        });
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
            
            client.hget('event_calids',trigger, (err, cal_id) => {
                if (err) return console.warn('Error in event_calids lookup.', err)
                if (!cal_id) return console.warn('No cal_id found!')

                scheduleReservation(trigger, email, startdt, cal_id);
            });
        });
    }
}

function configureTriggers(trigger_account) {
    const email = trigger_account.split(':')[0];
    client.smembers(trigger_account, (err, triggers) => {
        if (err) return console.warn('`smembers` failed for '+trigger_account)
        if (!triggers) return
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
        if (!startdts) return console.warn('event_startdts retrieval err', startdts);
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

/** Regloop **/
regloop(client, registration);

/** Express server **/
const PORT = process.env.PORT || 3001;
app.listen(PORT, () =>
    console.log(`Example app listening on port ${PORT}!`)
);
process.on("exit", function(){
    client.quit();
});
