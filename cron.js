var CronJob = require('cron').CronJob;
var job = new CronJob('40 15 * * *', function() {
  console.log('You will see this message every second');
}, null, true, 'Europe/Amsterdam');
job.start();