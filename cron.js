var cron = require('node-cron');

for (let i = 0; i<10; i++){

  cron.schedule('10 18 * * * ', () => {
    console.log('Running job '+i+'at 01:00 at sdsd/dssd timezone');
  }, {
  });
}

// var CronJob = require('cron').CronJob;
// var job = new CronJob('1-10 * * * * *', function() {
//   console.log('You will see this message every second');
// }, null, true, 'Europe/Amsterdam');
// job.start();