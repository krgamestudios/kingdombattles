//environment variables
require('dotenv').config();

//libraries
let CronJob = require('cron').CronJob;

//utilities
let { logDiagnostics } = require('./diagnostics.js');
let { log } = require('../common/utilities.js');

let { isSpying } = require('./utilities.js');

const spyRequest = (connection) => (req, res) => {
	//TODO
	res.status(400).write(log('Not yet implemented', 'spyRequest'));
	res.end();
};

const spyStatusRequest = (connection) => (req, res) => {
	//verify the credentials
	let query = 'SELECT COUNT(*) AS total FROM sessions WHERE accountId = ? AND token = ?;';
	connection.query(query, [req.body.id, req.body.token], (err, results) => {
		if (err) throw err;

		if (results[0].total !== 1) {
			res.status(400).write(log('Invalid spy status request credentials', req.body.id, req.body.token));
			res.end();
			return;
		}

		isSpying(connection, req.body.id, (err, spying, defender) => {
			if (err) throw err;

			res.status(200).json({
				status: spying ? 'spying' : 'idle',
				attacker: req.body.attacker,
				defender: defender,
				msg: null
			});

			res.end();
		});
	});
};

const spyLogRequest = (connection) => (req, res) => {
	//TODO
	res.status(400).write(log('Not yet implemented', 'spyLogRequest'));
	res.end();
};

const runSpyTick = (connection) => {
	//TODO
};

module.exports = {
	spyRequest: spyRequest,
	spyStatusRequest: spyStatusRequest,
	spyLogRequest: spyLogRequest,
	runSpyTick: runSpyTick
};

