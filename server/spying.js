//environment variables
require('dotenv').config();

//libraries
let CronJob = require('cron').CronJob;

//utilities
let { logDiagnostics } = require('./diagnostics.js');
let { log } = require('../common/utilities.js');

let { getStatistics, isSpying, isAttacking } = require('./utilities.js'); //TODO: rename getStatistics to getEquipmentStatistics

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
				defender: defender
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
	//find each pending spy event
	let spyTick = new CronJob('* * * * * *', () => {
		let query = 'SELECT * FROM pendingSpying WHERE eventTime < CURRENT_TIMESTAMP();';
		connection.query(query, (err, results) => {
			if (err) throw err;

			results.forEach((pendingSpying) => {
				//check that the attacker still has enough spies
				let query = 'SELECT spies FROM profiles WHERE accountId = ?;';
				connection.query(query, [pendingSpying.attackerId], (err, results) => {
					if (err) throw err;

					if (results[0].spies < pendingSpying.attackingUnits) {
						//delete the failed spying
						let query = 'DELETE FROM pendingSpying WHERE id = ?;';
						connection.query(query, [pendingSpying.id], (err) => {
							if (err) throw err;
							log('Not enough spies for spying', pendingSpying.attackerId, results[0].spies, pendingSpying.attackingUnits);
						});
						return;
					}

					//spy gameplay logic
					spyGameplayLogic(connection, pendingSpying);
				});
			});
		});
	});

	spyTick.start();
};

const spyGameplayLogic = (connection, pendingSpying) => {
	//determine how many pairs of defender eyes are available to spot the spies
	isAttacking(connection, pendingSpying.defenderId, (err, defenderIsAttacking) => {
		if (err) throw err;
		isSpying(connection, pendingSpying.defenderId, (err, defenderIsSpying) => {
			if (err) throw err;

			let query = 'SELECT * FROM profiles WHERE accountId = ?;';
			connection.query(query, [pendingSpying.defenderId], (err, results) => {
				if (err) throw err;

				let totalEyes = results[0].recruits + results[0].soldiers * !defenderIsAttacking + results[0].spies * !defenderIsSpying + results[0].scientists;

				//more spies reduces the chances of being seen? Counter intuitive
				let chanceSeen = totalEyes / pendingSpying.attackingUnits;

				//if seen
				if (Math.random() * 100 <= chanceSeen) {
					let query = 'INSERT INTO pastSpying (eventTime, attackerId, defenderId, attackingUnits, success, spoilsGold) VALUES (?, ?, ?, ?, "failure", 0);';
					connection.query(query, [pendingSpying.eventTime, pendingSpying.attackerId, pendingSpying.defenderId, pendingSpying.attackingUnits], (err) => {
						if (err) throw err;

						//spies die on failure
						let query = 'UPDATE profiles SET spies = spies - ? WHERE accountId = ?;';
						connection.query(query, [pendingSpying.attackingUnits, pendingSpying.attackerId], (err) => {
							if (err) throw err;

							//delete from pending
							let query = 'DELETE FROM pendingSpying WHERE id = ?;'
							connection.query(query, [pendingSpying.id], (err) => {
								if (err) throw err;

								log('Spy failed', pendingSpying.attackerId, pendingSpying.defenderId, pendingSpying.attackingUnits, totalEyes);
							});
						});
					});
				} else {
					//steal this much gold on success
					let spoilsGold = Math.random() >= 0.5 ? Math.floor(results[0].gold * 0.1) : 0; //50% chance of stealing gold
					let query = 'INSERT INTO pastSpying (eventTime, attackerId, defenderId, attackingUnits, success, spoilsGold) VALUES (?, ?, ?, ?, "success", ?);';
					connection.query(query, [pendingSpying.eventTime, pendingSpying.attackerId, pendingSpying.defenderId, pendingSpying.attackingUnits, spoilsGold], (err) => {
						if (err) throw err;

						let query = 'UPDATE profiles SET gold = gold + ? WHERE accountId = ?;';
						connection.query(query, [spoilsGold, pendingSpying.attackerId], (err) => {
							if (err) throw err;

							let query = 'UPDATE profiles SET gold = gold - ? WHERE accountId = ?;';
							connection.query(query, [spoilsGold, pendingSpying.defenderId], (err) => {
								if (err) throw err;

								//delete from pending
								let query = 'DELETE FROM pendingSpying WHERE id = ?;'
								connection.query(query, [pendingSpying.id], (err) => {
									if (err) throw err;

									log('Spy succeeded', pendingSpying.attackerId, pendingSpying.defenderId, pendingSpying.attackingUnits, totalEyes, spoilsGold);

									spyStealEquipment(connection, pendingSpying, spoilsGold);
								});
							});
						});
					});
				}
			});
		});;
	});
};

const spyStealEquipment = (connection, pendingSpying, spoilsGold) => {
	let query = 'SELECT id FROM pastSpying WHERE eventTime = ? AND attackerId = ? AND defenderId = ? AND spoilsGold = ?;'; //make it VERY hard to grab the wrong one
	connection.query(query, [pendingSpying.eventTime, pendingSpying.attackerId, pendingSpying.defenderId, spoilsGold], (err, results) => {
		if (err) throw err;

		for (let i = 0; i < pendingSpying.attackingUnits; i++) {
			//50% chance of stealing equipment
			if (Math.random() >= 0.5 || true) { //DEBUG
log('Attempting to steal');
				spyStealEquipmentInner(connection, pendingSpying.attackerId, pendingSpying.defenderId, results[0].id);
			} else {
log('Skipping steal');
			}
		}
	});
};

const spyStealEquipmentInner = (connection, attackerId, defenderId, pastSpyingId) => {
	//NOTE: steal equipment that isn't being carried by soldiers
	isAttacking(connection, defenderId, (err, isAttacking) => {
		let query = 'SELECT * FROM equipment WHERE accountId = ?;';
		connection.query(query, [defenderId], (err, results) => { //NOTE: async from here on out
			if (err) throw err;

			//if he's not attacking, skip to the next step
			if (!isAttacking) {
				return spyStealEquipmentInnerInner(connection, attackerId, defenderId, results, pastSpyingId);
			}

			//count the number of weapons/consumable items to be skipped, from strongest to weakest
			let query = 'SELECT soldiers FROM profiles WHERE accountId = ?;';
			connection.query(query, [defenderId], (err, results) => {
				if (err) throw err;

				let soldierCount = results[0].soldiers;

				//armour
				let query = 'SELECT * FROM equipment WHERE accountId = ? AND type = "Armour";';
				connection.query(query, [defenderId], (err, armourResults) => {
					if (err) throw err;

					//NOTE: Armour stays at home - it's never carried by soldiers

					//weapons
					let query = 'SELECT * FROM equipment WHERE accountId = ? AND type = "Weapon";';
					connection.query(query, [defenderId], (err, results) => {
						if (err) throw err;

						removeForEachSoldier(results, soldierCount, (err, weaponResults) => {
							if (err) throw err;

							//consumables
							let query = 'SELECT * FROM equipment WHERE accountId = ? AND type = "Consumable";';
							connection.query(query, [defenderId], (err, results) => {
								if (err) throw err;

								removeForEachSoldier(results, soldierCount, (err, consumableResults) => {
									if (err) throw err;

									//splice the two arrays back together
									let results = weaponResults.concat(consumableResults, armourResults);

									spyStealEquipmentInnerInner(connection, attackerId, defenderId, results, pastSpyingId);
								});
							});
						});
					});
				});
			});
		});
	});
};

const removeForEachSoldier = (results, soldiers, cb) => {
	getStatistics((err, { statistics }) => {
		if (err) throw err;
		results.sort((a, b) => statistics[a.type][a.name].combatBoost < statistics[b.type][b.name].combatBoost);

		results = results.map((item) => {
			//count downwards
			if (item.quantity > soldiers) {
				item.quantity -= soldiers;
				soldiers = 0;
			} else {
				soldiers -= item.quantity;
				item.quantity = 0;
			}

			return item;
		});

		results = results.filter(item => item.quantity > 0 && statistics[item.type][item.name].stealable);

		cb(undefined, results);
	});
}

const spyStealEquipmentInnerInner = (connection, attackerId, defenderId, results, pastSpyingId) => {
	//count the total items
	let totalItems = 0;
	results.forEach((item) => totalItems += item.quantity);

	//select the specific item to steal
	let selection = Math.floor(Math.random() * totalItems);

	//find the exact item that will be stolen
	let item = results.filter((item) => {
		selection -= item.quantity;
		if (selection < 0) {
			return item;
		}
	})[0];

	//NOTE: this is glacially slow

	//insert a new record - will clean up duplicates later
	let query = 'INSERT INTO equipment (accountId, name, type, quantity) VALUES (?, ?, ?, 1);';
	connection.query(query, [attackerId, item.name, item.type], (err) => {
		if (err) throw err;

		spyStealEquipmentInnerInnerInner(connection, attackerId, defenderId, item, pastSpyingId);
	});
};

const spyStealEquipmentInnerInnerInner = (connection, attackerId, defenderId, item, pastSpyingId) => {
	//decrement or remove the item
	if (item.quantity > 1) {
		let query = 'UPDATE equipment SET quantity = quantity - 1 WHERE id = ? AND quantity > 0;';
		connection.query(query, [item.id], (err) => {
			if (err) throw err;

			//move on to the next step
	//		spyStealEquipmentInnerInnerInnerInner(connection, attackerId, defenderId, item, pastSpyingId);
log('MARK 1');
		});
	} else {
		let query = 'DELETE FROM equipment WHERE id = ?;';
		connection.query(query, [item.id], (err) => {
			if (err) throw err;

			//
	//		spyStealEquipmentInnerInnerInnerInner(connection, attackerId, defenderId, item, pastSpyingId);
log('MARK 2');
		})
	}
};

const spyStealEquipmentInnerInnerInnerInner = (connection, attackerId, defenderId, item, pastSpyingId) => {
	//insert into items stolen
	let query = 'INSERT INTO equipmentStolen (pastSpyingId, name, type, quantity) VALUES (?, ?, ?, 1);';
	connection.query(query, [pastSpyingId, item.name, item.type], (err) => {
		if (err) throw err;

		//Holy nesting, batman!
		log('equipment stolen', attackerId, defenderId, item.id, item.name, item.type, pastSpyingId);
	});
};

module.exports = {
	spyRequest: spyRequest,
	spyStatusRequest: spyStatusRequest,
	spyLogRequest: spyLogRequest,
	runSpyTick: runSpyTick
};

