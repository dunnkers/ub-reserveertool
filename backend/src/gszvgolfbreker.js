const puppeteer = require('puppeteer');
const moment = require('moment');
const cron = require('node-cron');

const USER = process.env.GSZV_USERNAME;
const PASSWORD = process.env.GSZV_PASSWORD;

function fixTZ(hour) {
    servertime = new Date();
    localtime = new Date(new Date()
        .toLocaleString("nl-NL", { timeZone: "Europe/Amsterdam" }));
    const timediff = servertime.getHours() - localtime.getHours();
    return hour + timediff;
}

console.log('Activating CRON jobs for GSZV training booking...');
const pat1 = `1 30 ${fixTZ(17)} * * Saturday`;
cron.schedule(pat1, () => {
    console.log(`CRON triggered \`${pat1}\``);
    const week = moment(new Date()).week()+1;
    bookTraining(week, 'monday')
});
console.log(`> Scheduled CRON \`${pat1}\``)

const pat2 = `1 30 ${fixTZ(17)} * * Monday`;
cron.schedule(pat2, () => {
    console.log(`CRON triggered \`${pat2}\``);
    const week = moment(new Date()).week();
    bookTraining(week, 'wednesday');
});
console.log(`> Scheduled CRON \`${pat2}\``)

const pat3 = `1 30 ${fixTZ(18)} * * Wednesday`;
cron.schedule(pat3, () => {
    console.log(`CRON triggered \`${pat3}\``);
    const week = moment(new Date()).week();
    bookTraining(week, 'friday');
});
console.log(`> Scheduled CRON \`${pat3}\``)
console.log('Scheduled 3 weekly recurring CRON jobs ✅');

async function bookTraining(week, day) {
  console.log(`booking training for ${day} week ${week}...`)
  const browser = await puppeteer.launch();
  const page = await browser.newPage();
  await page.goto('https://www.golfbreker.org/en/login/');
  await page.type('input[id^=username-]', USER, {delay: 100});
  await page.type('input[id^=user_password-]', PASSWORD, {delay: 100});
  await page.click('input#um-submit-btn');
  await page.waitForNavigation({ timeout: 10000 });
  const url = `https://www.golfbreker.org/events/${day}-training-week-${week}/`
  await page.goto(url);
  await page.click('#em-booking-submit');
  await browser.close();
  console.log('training booked ✅');
};
