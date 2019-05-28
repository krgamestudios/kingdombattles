//environment variables
require('dotenv').config();

//utilities
let { log } = require('../common/utilities.js');

const attackRequest = (connection) => (req, res) => {
	//verify the attacker's credentials
	let query = 'SELECT accountId FROM sessions WHERE accountId IN (SELECT id FROM accounts WHERE username = ?) AND token = ?;';
	connection.query(query, [req.body.attacker, req.body.token], (err, results) => {
		if (err) throw err;

		if (results.length !== 1) {
			res.status(400).write(log('Invalid attack credentials', req.body.attacker, req.body.defender, req.body.token));
			res.end();
			return;
		}

		let attackerId = results[0].accountId;

		//verify that the defender exists
		let query = 'SELECT id FROM accounts WHERE username = ?;';
		connection.query(query, [req.body.defender], (err, results) => {
			if (err) throw err;

			if (results.length !== 1) {
				res.status(400).write(log('Invalid defender credentials', req.body.attacker, req.body.defender));
				res.end();
				return;
			}

			let defenderId = results[0].id;

			//verify that the attacker has enough soldiers
			let query = 'SELECT soldiers FROM profiles WHERE accountId = ?;';
			connection.query(query, [attackerId], (err, results) => {
				if (err) throw err;

				if (results[0].soldiers <= 0) {
					res.status(400).write(log('Not enough soldiers', req.body.attacker, req.body.defender, results[0].soldiers));
					res.end();
					return;
				}

				let attackingUnits = results[0].soldiers;

				//verify that the attacker is not already attacking someone
				isAttacking(connection, req.body.attacker, (isAttacking) => {
					if (isAttacking) {
						res.status(400).write(log('You are already attacking someone', req.body.attacker, req.body.defender));
						res.end();
						return;
					}

					//create the pending attack value
					let query = 'INSERT INTO pendingCombat (eventTime, attackerId, defenderId, attackingUnits) VALUES (DATE_ADD(CURRENT_TIMESTAMP(), INTERVAL 10 * ? SECOND), ?, ?, ?);';
					connection.query(query, [attackingUnits, attackerId, defenderId, attackingUnits], (err) => {
						if (err) throw err;

						res.status(200).write(log(`Your soldiers are on their way to attack ${req.body.defender}`, req.body.attacker, req.body.defender));
						res.end();
					});
				});
			});
		});
	});
}

const attackStatusRequest = (connection) => (req, res) => {
	isAttacking(connection, req.body.username, (isAttacking) => {
		res.status(200).write(log(isAttacking ? 'attacking' : 'idle', req.body.username));
		res.end();
	});
}

const isAttacking = (connection, username, cb) => {
	let query = 'SELECT * FROM pendingCombat WHERE attackerId IN (SELECT id FROM accounts WHERE username = ?);';
	connection.query(query, [username], (err, results) => {
		if (err) throw err;

		return cb(results.length !== 0);
	});
}

module.exports = {
	attackRequest: attackRequest,
	attackStatusRequest: attackStatusRequest
}

/*
> You can attack another player using your soldiers (it doesn't work without soldiers).
* Doing so takes time, up to 10 seconds for every soldier you have.
* Combat takes place at the end of the time delay, at which point you can attack people again (after reloading the page).
> While attacking, you are undefended.
* While undefended, your recruits act as combatants, otherwise your soldiers do.
* The chance of success is determined by the ratio of each side's combatant strength.
* Recruits have a strength equal to 0.25 times that of a soldier.
* On a success, you steal 10% of the target's gold. On a failure, you steal 2% of the target's gold.
* The attacking force will lose a percentage, rounded down, of their units - 5% on a success, 10% on a failure (edit: excluding the first 10 units).
* If the server resets (which happens alot) combat still progresses as expected.
* All combat is logged and presented to the player.
*/

