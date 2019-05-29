//environment variables
require('dotenv').config();

//libraries
let CronJob = require('cron').CronJob;

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
					let query = 'INSERT INTO pendingCombat (eventTime, attackerId, defenderId, attackingUnits) VALUES (DATE_ADD(CURRENT_TIMESTAMP(), INTERVAL 60 * ? SECOND), ?, ?, ?);';
					connection.query(query, [attackingUnits, attackerId, defenderId, attackingUnits], (err) => {
						if (err) throw err;

						res.status(200).json({
							status: 'attacking',
							defender: req.body.defender
						});
						res.end();

						log(`attacking ${req.body.defender}`, req.body.attacker, req.body.defender)
					});
				});
			});
		});
	});
}

const attackStatusRequest = (connection) => (req, res) => {
	isAttacking(connection, req.body.username, (isAttacking, defender) => {
		res.status(200).json({
			status: log(isAttacking ? 'attacking' : 'idle', req.body.username, defender),
			defender: defender
		});

		res.end();
	});
}

const combatLogRequest = (connection) => (req, res) => {
	let query = 'SELECT pastCombat.*, atk.username AS attackerUsername, def.username AS defenderUsername FROM pastCombat JOIN accounts AS atk ON pastCombat.attackerId = atk.id JOIN accounts AS def ON pastCombat.defenderId = def.id WHERE atk.username = ? OR def.username = ? ORDER BY eventTime DESC LIMIT ?, ?;';
	connection.query(query, [req.body.username, req.body.username, req.body.start, req.body.length], (err, results) => {
		if (err) throw err;

		res.status(200).json(results);
		log('Combat log sent', req.body.username, req.body.start, req.body.length, JSON.stringify(results));
	});
}

const runCombatTick = (connection) => {
	let combatTick = new CronJob('* * * * * *', () => {
		//find each pending combat
		let query = 'SELECT * FROM pendingCombat WHERE eventTime < CURRENT_TIMESTAMP();';
		connection.query(query, (err, results) => {
			if (err) throw err;

			results.forEach((pendingCombat) => {
				//get the defender's undefended status
				isAttacking(connection, pendingCombat.defenderId, (undefended) => {
					//get the defending unit count, gold
					let query = 'SELECT soldiers, recruits, gold FROM profiles WHERE accountId = ?;';

					connection.query(query, [pendingCombat.defenderId], (err, results) => {
						if (err) throw err;

						let defendingUnits;
						if (!undefended && results[0].soldiers > 0) {
							defendingUnits = results[0].soldiers;
						} else {
							defendingUnits = results[0].recruits;
						}

						//determine the victor
						let rand = Math.random() * (pendingCombat.attackingUnits + defendingUnits * (undefended ? 0.25 : 1));
						let victor = rand <= pendingCombat.attackingUnits ? 'attacker' : 'defender';

						//determine the spoils and casualties
						let spoilsGold = Math.floor(results[0].gold * (victor === 'attacker' ? 0.1 : 0.02));
						let casualtiesVictor = Math.floor((pendingCombat.attackingUnits >= 10 ? pendingCombat.attackingUnits - 10 : 0) * (victor === 'attacker' ? 0.05 : 0.1));

						//NOTE: there is a negative gold bug somewhere
						if (spoilsGold <= 0) {
							log('WARNING: spoilsGold <= 0', pendingCombat.attackerId, pendingCombat.defenderId, spoilsGold);
						}

						//save the combat
						let query = 'INSERT INTO pastCombat (eventTime, attackerId, defenderId, attackingUnits, defendingUnits, undefended, victor, spoilsGold, casualtiesVictor) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?);';
						connection.query(query, [pendingCombat.eventTime, pendingCombat.attackerId, pendingCombat.defenderId, pendingCombat.attackingUnits, defendingUnits, undefended, victor, spoilsGold, casualtiesVictor], (err) => {
							if (err) throw err;

							//update the attacker profile
							let query = 'UPDATE profiles SET gold = gold + ?, soldiers = soldiers - ? WHERE id = ?;';
							connection.query(query, [spoilsGold, casualtiesVictor, pendingCombat.attackerId], (err) => {
								if (err) throw err;

								//update the defender profile
								let query = 'UPDATE profiles SET gold = gold - ? WHERE id = ?;';
								connection.query(query, [spoilsGold, pendingCombat.defenderId], (err) => {
									if (err) throw err;

									//delete the pending combat
									let query = 'DELETE FROM pendingCombat WHERE id = ?;';
									connection.query(query, [pendingCombat.id], (err) => {
										if (err) throw err;

										log('Combat executed', pendingCombat.attackerId, pendingCombat.defenderId, victor);
									});
								});
							});
						});
					});
				});
			});
		});
	});

	combatTick.start();
}

const isAttacking = (connection, user, cb) => {
	let query;

	if (typeof(user) === 'string') {
		query = 'SELECT * FROM pendingCombat WHERE attackerId IN (SELECT id FROM accounts WHERE username = ?);';
	} else if (typeof(user) === 'number') {
		query = 'SELECT * FROM pendingCombat WHERE attackerId = ?;';
	}

	connection.query(query, [user], (err, results) => {
		if (err) throw err;

		if (results.length === 0) {
			cb(false);
		} else {
			//get the username of the person being attacked
			let query = 'SELECT username FROM accounts WHERE id = ?;';
			connection.query(query, [results[0].defenderId], (err, results) => {
				if (err) throw err;
				cb(true, results[0].username);
			});
		}
	});
}

module.exports = {
	attackRequest: attackRequest,
	attackStatusRequest: attackStatusRequest,
	combatLogRequest: combatLogRequest,
	runCombatTick: runCombatTick
}

/*
> You can attack another player using your soldiers (it doesn't work without soldiers).
> Doing so takes time, up to 10 seconds for every soldier you have.
> Combat takes place at the end of the time delay, at which point you can attack people again (after reloading the page).
> While attacking, you are undefended.
> While undefended, your recruits act as combatants, otherwise your soldiers do.
> The chance of success is determined by the ratio of each side's combatant strength.
> Recruits have a strength equal to 0.25 times that of a soldier.
> On a success, you steal 10% of the target's gold. On a failure, you steal 2% of the target's gold.
> The attacking force will lose a percentage, rounded down, of their units - 5% on a success, 10% on a failure (edit: excluding the first 10 units).
> If the server resets (which happens alot) combat still progresses as expected.
* All combat is logged and presented to the player.
*/

