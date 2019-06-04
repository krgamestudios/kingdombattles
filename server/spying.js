//environment variables
require('dotenv').config();

//libraries
let CronJob = require('cron').CronJob;

//utilities
let { logDiagnostics } = require('./diagnostics.js');
let { log } = require('../common/utilities.js');

let { isSpying } = require('./utilities.js');

const spyRequest = (connection) => (req, res) => {
	//verify the attacker's credentials (only the attacker can launch an attack)
	let query = 'SELECT COUNT(*) AS total FROM sessions WHERE accountId = ? AND accountId IN (SELECT id FROM accounts WHERE username = ?) AND token = ?;';
	connection.query(query, [req.body.id, req.body.attacker, req.body.token], (err, results) => {
		if (err) throw err;

		if (results[0].total !== 1) {
			res.status(400).write(log('Invalid spying credentials', req.body.id, req.body.attacker, req.body.defender, req.body.token));
			res.end();
			return;
		}

		//verify that the defender's profile exists
		let query = 'SELECT accountId FROM profiles WHERE accountId IN (SELECT id FROM accounts WHERE username = ?);';
		connection.query(query, [req.body.defender], (err, results) => {
			if (err) throw err;

			if (results.length !== 1) {
				res.status(400).write(log('Invalid defender spying credentials', req.body.id, req.body.attacker, req.body.defender, req.body.token));
				res.end();
				return;
			}

			let defenderId = results[0].accountId;

			//verify that the attacker has enough spies
			let query = 'SELECT spies FROM profiles WHERE accountId = ?;';
			connection.query(query, [req.body.id], (err, results) => {
				if (err) throw err;

				if (results[0].spies <= 0) {
					res.status(400).write(log('Not enough spies', req.body.attacker, req.body.defender, results[0].spies));
					res.end();
					return;
				}

				let attackingUnits = results[0].spies;

				//verify that the attacker is not already spying on someone
				isSpying(connection, req.body.attacker, (err, spying) => {
					if (err) throw err;

					if (spying) {
						res.status(400).write(log('You are already spying on someone', req.body.id, req.body.attacker, req.body.token));
						res.end();
						return;
					}

					//create the pending spy record
					let query = 'INSERT INTO pendingSpying (eventTime, attackerId, defenderId, attackingUnits) VALUES (DATE_ADD(CURRENT_TIMESTAMP(), INTERVAL 10 * ? MINUTE), ?, ?, ?);';
					connection.query(query, [attackingUnits, req.body.id, defenderId, attackingUnits], (err) => {
						if (err) throw err;

						res.status(200).json({
							status: 'spying',
							attacker: req.body.attacker,
							defender: req.body.defender,
							msg: log('Spying', req.body.attacker, req.body.defender) //TODO: am I using this msg parameter anywhere?
						});
						res.end();
					});
				});
			});
		});
	});
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

