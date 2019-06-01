//environment variables
require('dotenv').config();

//libraries
let CronJob = require('cron').CronJob;

//utilities
let { log } = require('../common/utilities.js');

const attackRequest = (connection) => (req, res) => {
	//verify the attacker's credentials (only the attacker can launch an attack)
	let query = 'SELECT COUNT(*) AS total FROM sessions WHERE accountId = ? AND accountId IN (SELECT id FROM accounts WHERE username = ?) AND token = ?;';
	connection.query(query, [req.body.id, req.body.attacker, req.body.token], (err, results) => {
		if (err) throw err;

		if (results[0].total !== 1) {
			res.status(400).write(log('Invalid attack credentials', req.body.id, req.body.attacker, req.body.defender, req.body.token));
			res.end();
			return;
		}

		//verify that the defender's profile exists
		let query = 'SELECT accountId FROM profiles WHERE accountId IN (SELECT id FROM accounts WHERE username = ?);';
		connection.query(query, [req.body.defender], (err, results) => {
			if (err) throw err;

			if (results.length !== 1) {
				res.status(400).write(log('Invalid defender credentials', req.body.id, req.body.attacker, req.body.defender, req.body.token));
				res.end();
				return;
			}

			let defenderId = results[0].accountId;

			//verify that the attacker has enough soldiers
			let query = 'SELECT soldiers FROM profiles WHERE accountId = ?;';
			connection.query(query, [req.body.id], (err, results) => {
				if (err) throw err;

				if (results[0].soldiers <= 0) {
					res.status(400).write(log('Not enough soldiers', req.body.attacker, req.body.defender, results[0].soldiers));
					res.end();
					return;
				}

				let attackingUnits = results[0].soldiers;

				//verify that the attacker is not already attacking someone
				isAttacking(connection, req.body.attacker, (err, attacking) => {
					if (err) throw err;

					if (attacking) {
						res.status(400).write(log('You are already attacking someone', req.body.id, req.body.attacker, req.body.token));
						res.end();
						return;
					}

					//create the pending attack record
					let query = 'INSERT INTO pendingCombat (eventTime, attackerId, defenderId, attackingUnits) VALUES (DATE_ADD(CURRENT_TIMESTAMP(), INTERVAL 60 * ? SECOND), ?, ?, ?);';
					connection.query(query, [attackingUnits, req.body.id, defenderId, attackingUnits], (err) => {
						if (err) throw err;

						res.status(200).json({
							status: 'attacking',
							attacker: req.body.attacker,
							defender: req.body.defender,
							msg: log('Attacking', req.body.attacker, req.body.defender)
						});
						res.end();
					});
				});
			});
		});
	});
};

const attackStatusRequest = (connection) => (req, res) => { //TODO: proper credentials
	isAttacking(connection, req.body.attacker, (err, attacking, defender) => {
		if (err) throw err;

		res.status(200).json({
			status: attacking ? 'attacking' : 'idle',
			attacker: req.body.attacker,
			defender: defender,
			msg: null
		});

		res.end();
	});
};

const combatLogRequest = (connection) => (req, res) => {
	let query = 'SELECT pastCombat.*, atk.username AS attacker, def.username AS defender FROM pastCombat JOIN accounts AS atk ON pastCombat.attackerId = atk.id JOIN accounts AS def ON pastCombat.defenderId = def.id WHERE atk.username = ? OR def.username = ? ORDER BY eventTime DESC LIMIT ?, ?;';
	connection.query(query, [req.body.username, req.body.username, req.body.start, req.body.length], (err, results) => {
		if (err) throw err;

		res.status(200).json(results);
		log('Combat log sent', req.body.username, req.body.start, req.body.length);
	});
};

const runCombatTick = (connection) => {
	//once per second
	let combatTick = new CronJob('* * * * * *', () => {
		//find each pending combat
		let query = 'SELECT * FROM pendingCombat WHERE eventTime < CURRENT_TIMESTAMP();';
		connection.query(query, (err, results) => {
			if (err) throw err;

			results.forEach((pendingCombat) => {
				//check that the attacker still has enough soliders
				let query = 'SELECT soldiers FROM profiles WHERE accountId = ?;';
				connection.query(query, [pendingCombat.attackerId], (err, results) => {
					if (err) throw err;

					if (results[0].soldiers < pendingCombat.attackingUnits) {
						//delete the failed combat
						let query = 'DELETE FROM pendingCombat WHERE id = ?;';
						connection.query(query, [pendingCombat.id], (err) => {
							if (err) throw err;
							log('Not enough soldiers for attack', pendingCombat.attackerId, results[0].soldiers, pendingCombat.attackingUnits);
						});
						return;
					}

					//get the defender's undefended status
					isAttacking(connection, pendingCombat.defenderId, (err, undefended) => {
						if (err) throw err;

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
							//TODO: add equipment effectiveness
							let rand = Math.random() * (pendingCombat.attackingUnits + defendingUnits * (undefended ? 0.25 : 1));
							let victor = rand <= pendingCombat.attackingUnits ? 'attacker' : 'defender';

							//determine the spoils and casualties
							let spoilsGold = Math.floor(results[0].gold * (victor === 'attacker' ? 0.1 : 0.02));
							let attackerCasualties = Math.floor((pendingCombat.attackingUnits >= 10 ? pendingCombat.attackingUnits - 10 : 0) * (victor === 'attacker' ? 0.05 : 0.1));

							//save the combat
							let query = 'INSERT INTO pastCombat (eventTime, attackerId, defenderId, attackingUnits, defendingUnits, undefended, victor, spoilsGold, attackerCasualties) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?);';
							connection.query(query, [pendingCombat.eventTime, pendingCombat.attackerId, pendingCombat.defenderId, pendingCombat.attackingUnits, defendingUnits, undefended, victor, spoilsGold, attackerCasualties], (err) => {
								if (err) throw err;

								//update the attacker profile
								let query = 'UPDATE profiles SET gold = gold + ?, soldiers = soldiers - ? WHERE accountId = ?;';
								connection.query(query, [spoilsGold, attackerCasualties, pendingCombat.attackerId], (err) => {
									if (err) throw err;

									//update the defender profile
									let query = 'UPDATE profiles SET gold = gold - ? WHERE accountId = ?;';
									connection.query(query, [spoilsGold, pendingCombat.defenderId], (err) => {
										if (err) throw err;

										//delete the pending combat
										let query = 'DELETE FROM pendingCombat WHERE id = ?;';
										connection.query(query, [pendingCombat.id], (err) => {
											if (err) throw err;

											log('Combat executed', pendingCombat.attackerId, pendingCombat.defenderId, victor, spoilsGold);
										});
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
};

const isNormalInteger = (str) => {
    let n = Math.floor(Number(str));
    return n !== Infinity && String(n) == str && n >= 0;
};

const isAttacking = (connection, user, cb) => {
	let query;

	if (isNormalInteger(user)) {
		query = 'SELECT * FROM pendingCombat WHERE attackerId = ?;';
	} else if (typeof(user) === 'string') {
		query = 'SELECT * FROM pendingCombat WHERE attackerId IN (SELECT id FROM accounts WHERE username = ?);';
	} else {
		return cb(`Unknown argument type for user: ${typeof(user)}`);
	}

	connection.query(query, [user], (err, results) => {
		if (err) throw err;

		if (results.length === 0) {
			return cb(undefined, false);
		} else {
			//get the username of the person being attacked
			let query = 'SELECT username FROM accounts WHERE id = ?;';
			connection.query(query, [results[0].defenderId], (err, results) => {
				if (err) throw err;
				return cb(undefined, true, results[0].username);
			});
		}
	});
};

module.exports = {
	attackRequest: attackRequest,
	attackStatusRequest: attackStatusRequest,
	combatLogRequest: combatLogRequest,
	runCombatTick: runCombatTick,
	isAttacking: isAttacking
};
