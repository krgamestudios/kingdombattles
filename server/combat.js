//environment variables
require('dotenv').config();

//libraries
let CronJob = require('cron').CronJob;

//utilities
let { logDiagnostics } = require('./diagnostics.js');
let { log } = require('../common/utilities.js');

let { getStatistics, isAttacking } = require('./utilities.js');

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

const attackStatusRequest = (connection) => (req, res) => {
	//verify the credentials
	let query = 'SELECT COUNT(*) AS total FROM sessions WHERE accountId = ? AND token = ?;';
	connection.query(query, [req.body.id, req.body.token], (err, results) => {
		if (err) throw err;

		if (results[0].total !== 1) {
			res.status(400).write(log('Invalid attack status request credentials', req.body.id, req.body.token));
			res.end();
			return;
		}

		isAttacking(connection, req.body.id, (err, attacking, defender) => {
			if (err) throw err;

			res.status(200).json({
				status: attacking ? 'attacking' : 'idle',
				defender: defender
			});

			res.end();
		});
	});
};

const combatLogRequest = (connection) => (req, res) => {
	//verify the user's credentials
	let query = 'SELECT COUNT(*) AS total FROM sessions WHERE accountId = ? AND token = ?;';
	connection.query(query, [req.body.id, req.body.token], (err, results) => {
		if (err) throw err;

		if (results[0].total !== 1) {
			res.status(400).write(log('Invalid combat log credentials', req.body.id, req.body.token));
			res.end();
			return;
		}

		//grab the username based on the ID
		let query = 'SELECT username FROM accounts WHERE id = ?;';
		connection.query(query, [req.body.id], (err, results) => {
			if (err) throw err;

			let query = 'SELECT pastCombat.*, atk.username AS attacker, def.username AS defender FROM pastCombat JOIN accounts AS atk ON pastCombat.attackerId = atk.id JOIN accounts AS def ON pastCombat.defenderId = def.id WHERE atk.username = ? OR def.username = ? ORDER BY eventTime DESC LIMIT ?, ?;';
			connection.query(query, [results[0].username, results[0].username, req.body.start, req.body.length], (err, results) => {
				if (err) throw err;

				res.status(200).json(results);
				log('Combat log sent', results[0].username, req.body.id, req.body.token, req.body.start, req.body.length);
			});
		});
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
								undefended = true; //recruits only
							}

							//get the attacker equipment
							let query = 'SELECT * FROM equipment WHERE accountId = ? AND type = "Weapon";';
							connection.query(query, [pendingCombat.attackerId], (err, attackerEquipment) => {
								if (err) throw err;

								//get the defender equipment
								let query = 'SELECT * FROM equipment WHERE accountId = ? AND type = "Armour";';
								connection.query(query, [pendingCombat.defenderId], (err, defenderEquipment) => {
									if (err) throw err;

									//get the attacker consumables
									let query = 'SELECT * FROM equipment WHERE accountId = ? AND type = "Consumable";';
									connection.query(query, [pendingCombat.attackerId], (err, attackerConsumables) => {
										if (err) throw err;

										//get the defender consumables
										let query = 'SELECT * FROM equipment WHERE accountId = ? AND type = "Consumable";';
										connection.query(query, [pendingCombat.defenderId], (err, defenderConsumables) => {
											if (err) throw err;

											//get the global equipment stats
											getStatistics((err, { statistics }) => {
												if (err) throw err;

												//get the combat boosts from equipment, from highest to lowest
												attackerEquipment.sort((a, b) => statistics[a.type][a.name].combatBoost < statistics[b.type][b.name].combatBoost);
												let attackerEquipmentBoost = 0;
												for (let i = 0; i < pendingCombat.attackingUnits; i++) {
													attackerEquipmentBoost += attackerEquipment[i] ? statistics[attackerEquipment[i].type][attackerEquipment[i].name].combatBoost : 0;
												}

												defenderEquipment.sort((a, b) => statistics[a.type][a.name].combatBoost < statistics[b.type][b.name].combatBoost);
												let defenderEquipmentBoost = 0;
												for (let i = 0; i < defendingUnits; i++) {
													defenderEquipmentBoost += defenderEquipment[i] ? statistics[defenderEquipment[i].type][defenderEquipment[i].name].combatBoost : 0;
												}

												//get the boosts from consumables
												attackerConsumables.sort((a, b) => statistics[a.type][a.name].combatBoost < statistics[b.type][b.name].combatBoost);
												let attackerConsumablesBoost = 0;
												for (let i = 0; i < pendingCombat.attackingUnits; i++) {
													attackerConsumablesBoost += attackerConsumables[i] ? statistics[attackerConsumables[i].type][attackerConsumables[i].name].combatBoost : 0;
												}

												defenderConsumables.sort((a, b) => { statistics[a.type][a.name].combatBoost < statistics[b.type][b.name].combatBoost});
												let defenderConsumablesBoost = 0;
												for (let i = 0; i < defendingUnits; i++) {
													defenderConsumablesBoost += defenderConsumables[i] ? statistics[defenderConsumables[i].type][defenderConsumables[i].name].combatBoost : 0;
												}

												//determine the victor (defender wants high rand, attacker wants low rand)
												let rand = Math.random() * (pendingCombat.attackingUnits + defenderEquipmentBoost + defenderConsumablesBoost + defendingUnits * (undefended ? 0.25 : 1));
												let victor = rand <= attackerEquipmentBoost + attackerConsumablesBoost + pendingCombat.attackingUnits ? 'attacker' : 'defender';

												//determine the spoils and casualties
												let spoilsGold = Math.floor(results[0].gold * (victor === 'attacker' ? 0.1 : 0.02));
												let attackerCasualties = Math.floor((pendingCombat.attackingUnits >= 10 ? pendingCombat.attackingUnits : 0) * (victor === 'attacker' ? Math.random() / 5 : Math.random() / 2));

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

															//remove used consumables (moved because callback hell is rediculous)
															removeConsumables(connection, attackerConsumables, pendingCombat.attackingUnits);
															removeConsumables(connection, defenderConsumables, defendingUnits);

															//delete the pending combat
															let query = 'DELETE FROM pendingCombat WHERE id = ?;';
															connection.query(query, [pendingCombat.id], (err) => {
																if (err) throw err;

																log('Combat executed', pendingCombat.attackerId, pendingCombat.defenderId, victor, spoilsGold);
																logDiagnostics(connection, 'death', attackerCasualties);

																//clean the database
																let query = 'DELETE FROM equipment WHERE quantity <= 0;';
																connection.query(query, (err) => {
																	if (err) throw err;

																	log('Cleaned database', 'Combat consumables');
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
						});
					});
				});
			});
		});
	});

	combatTick.start();
};

//Part of runCombatTick
let removeConsumables = (connection, consumables, number) => {
	if (number > 0 && consumables.length > 0) {
		//if not rolling to the next stack after this
		if (number - consumables[0].quantity <= 0) {
			let query = 'UPDATE equipment SET quantity = quantity - ? WHERE id = ?;';
			connection.query(query, [number, consumables[0].id], (err) => {
				if (err) throw err;
			});

			return;
		} else { //will be rolling to the next stack after this
			let query = 'UPDATE equipment SET quantity = 0 WHERE id = ?;';

			connection.query(query, [consumables[0].id], (err) => {
				if (err) throw err;

				//tick
				number -= consumables[0].quantity;
				consumables.shift();

				//it took me two hours to write this line; you can't make functions inside loops	
				return removeConsumables(connection, consumables, number);
			});
		}
	}
};

module.exports = {
	attackRequest: attackRequest,
	attackStatusRequest: attackStatusRequest,
	combatLogRequest: combatLogRequest,
	runCombatTick: runCombatTick
};
