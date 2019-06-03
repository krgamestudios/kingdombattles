//environment variables
require('dotenv').config();

//libraries
let CronJob = require('cron').CronJob;

//utilities
let { log } = require('../common/utilities.js');

const runDailyDiagnostics = (connection) => {
	let dailyJob = new CronJob('0 0 * * * *', () => {
		let query = 'INSERT INTO diagnostics (playerCount, returnedPlayerCount, totalGold, totalRecruitments, totalDeaths, totalCombats) VALUES ((SELECT COUNT(*) FROM profiles), (SELECT COUNT(*) FROM profiles WHERE (recruits + soldiers + spies + scientists) >= 2), (SELECT SUM(gold) FROM profiles), (IFNULL((SELECT SUM(quantity) FROM diagnosticsEvents WHERE eventName = "recruit"), 0)), (IFNULL((SELECT SUM(quantity) FROM diagnosticsEvents WHERE eventName = "death"), 0)), (SELECT COUNT(*) FROM pastCombat WHERE eventTime >= DATE_SUB(CURRENT_TIMESTAMP(), INTERVAL 1 DAY)));';
		connection.query(query, (err) => {
			if (err) throw err;

			let query = 'DELETE FROM diagnosticsEvents;';
			connection.query(query, (err) => {
				if (err) throw err;

				log('Daily diagnostics taken');
			});
		});
	});

	dailyJob.start();
};

//current name parameters: 'recruit', 'death'
const logDiagnostics = (connection, name, quantity) => {
	let query = 'INSERT INTO diagnosticsEvents (eventName, quantity) VALUES (?, ?);';
	connection.query(query, [name, quantity], (err) => {
		if (err) throw err;
	});
};

module.exports = {
	runDailyDiagnostics: runDailyDiagnostics,
	logDiagnostics: logDiagnostics
};