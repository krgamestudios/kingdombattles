let CronJob = require('cron').CronJob;

let emails = [];

function throttle(email) {
	emails[email] = new Date();
}

function isThrottled(email) {
	if (emails[email] === undefined) {
		return false;
	}

	if ( Math.abs(emails[email] - new Date()) / 1000 > 3) { //3 seconds
		return false;
	}

	return true;
}

//clear the memory once a day
let job = new CronJob('0 7 * * * *', () => {
	emails = [];
});

job.start();

module.exports = {
	throttle: throttle,
	isThrottled: isThrottled
};