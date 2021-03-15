const redis = require('redis');

if (!process.env.REDIS_ROOT_PASSWORD) throw new Error('Must set Redis password!')

let client;

if (process.env.REDIS_URL) {
    console.log('We are on Heroku.')
    client = redis.createClient(process.env.REDIS_URL);
} else {
    console.log('Connecting to a custom server instance.')
    const host = process.env.REDIS_IP || 'localhost';
    const port = process.env.REDIS_PORT || 6379;
    console.log(`Connecting to Redis at ${host}:${port}`);
    client = redis.createClient(port, host, {
        password: process.env.REDIS_ROOT_PASSWORD
    });
}

client.on('error', (err) => console.error('ERR:REDIS:', err));
module.exports = client;