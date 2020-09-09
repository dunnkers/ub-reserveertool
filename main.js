const bent = require('bent');
const formurlencoded = require('form-urlencoded').default;
const redis = require('redis');
const express = require('express');
const bodyParser = require('body-parser');
const cors = require('cors');

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
        'id': id,
        'formData[event_id]': event_id,
        'formData[cal_id]': '7564',
        'formData[wl]': '0',
        'formData[qcount]': '1',
        'formData[fid]': '5455',
        ...user
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

const host = process.env.REDIS_IP || 'localhost';
const client = redis.createClient(6379, host, {
    password: process.env.REDIS_ROOT_PASSWORD || null
});
client.on('error', (err) => console.error('ERR:REDIS:', err));


app.post('/register', (req, res) => {
    if (!req.body.email) return res.status(500).send('No email supplied')
    if (!req.body.event_id) return res.status(500).send('No event id supplied')
    console.log('registering ' + req.body.email + ' for event ' + req.body.event_id);
    
    client.hgetall(req.body.email, (err, user) => {
        if (!user) return res.status(500).send('No account in db')

        // if already available.
        register(req.body.event_id, user).then(res.json).catch((err) => {
            console.warn(err);
            res.status(500).send('error whilst registering!');
        });

        // schedule reservation.
        client.sadd(req.body.email+':reservations', req.body.event_id);
        return res.json({'message':'Made reservation'})
    });
});

app.post('/reservations', (req, res) => {
    if (!req.body.email) return res.status(500).send('No email supplied')
    client.smembers(req.body.email+':reservations', (err, value) => {
        return res.json({'reservations':value});
    });
});

app.post('/create', (req, res) => {
    if (!req.body.email) return res.status(500).send('No email supplied')
    console.log('creating account ' + req.body.email);
    client.HMSET(req.body.email, req.body);
    res.json({'message': 'Account created.'});
});

app.post('/identify', (req, res) => {
    if (!req.body.email) return res.status(500).send('No email supplied');
    console.log('looking up info for ' + req.body.email);
    client.hgetall(req.body.email, (err, value) => {
        console.log('looked up.');
        return res.json(value);
    });
});

app.post('/register_account', (req, res) => {
    if (!req.body.email) return res.status(500).send('No email supplied');
    if (!req.body.email) return res.status(500).send('No email supplied');
    if (!req.body.email) return res.status(500).send('No email supplied');
    if (!req.body.email) return res.status(500).send('No email supplied');
    if (!req.body.email) return res.status(500).send('No email supplied');
    console.log('registering account' + req.body.email);
    client.hgetall(req.body.email, (err, value) => {
        console.log('looked up.');
        return res.json(value);
    });
})

app.listen(3001, () =>
    console.log(`Example app listening on port 3001!`),
);
process.on("exit", function(){
    client.quit();
});

// client.quit();
// register(3491811, me).then(() => {
//     console.log('Registration completed.');
// }).catch(console.warn);