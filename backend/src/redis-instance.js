const redis = require('redis');

if (!process.env.REDIS_ROOT_PASSWORD) throw new Error('Must set Redis password!')

const host = process.env.REDIS_IP || 'localhost';
const client = redis.createClient(6379, host, {
    password: process.env.REDIS_ROOT_PASSWORD
});

client.on('error', (err) => console.error('ERR:REDIS:', err));
module.exports = client;