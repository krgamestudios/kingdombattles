//environment variables
require('dotenv').config();

//libraries
let CronJob = require('cron').CronJob;

//utilities
let { logDiagnostics } = require('./diagnostics.js');
let { log } = require('../common/utilities.js');

let { getEquipmentStatistics, isSpying, isAttacking, logActivity } = require('./utilities.js');

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

						logActivity(connection, req.body.id);
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
	//verify the user's credentials
	let query = 'SELECT COUNT(*) AS total FROM sessions WHERE accountId = ? AND token = ?;';
	connection.query(query, [req.body.id, req.body.token], (err, results) => {
		if (err) throw err;

		if (results[0].total !== 1) {
			res.status(400).write(log('Invalid spy log credentials', req.body.id, req.body.token));
			res.end();
			return;
		}

		//grab the spying log and equipment stolen based on the id
		let query = 'SELECT pastSpying.id AS id, pastSpying.eventTime AS eventTime, pastSpying.attackerId AS attackerId, pastSpying.defenderId AS defenderId, atk.username AS attackerUsername, def.username AS defenderUsername, pastSpying.attackingUnits AS attackingUnits, pastSpying.success AS success, pastSpying.spoilsGold AS spoilsGold, equipmentStolen.name AS equipmentStolenName, equipmentStolen.type AS equipmentStolenType, equipmentStolen.quantity AS equipmentStolenQuantity FROM pastSpying LEFT JOIN equipmentStolen ON pastSpying.id = equipmentStolen.pastSpyingId LEFT JOIN accounts AS atk ON pastSpying.attackerId = atk.id LEFT JOIN accounts AS def ON pastSpying.defenderId = def.id WHERE pastSpying.attackerId = ? OR pastSpying.defenderId = ? ORDER BY eventTime DESC LIMIT ?, ?;';
		connection.query(query, [req.body.id, req.body.id, req.body.start, req.body.length], (err, results) => {
			if (err) throw err;

			//build the sendable data structure (delete names from successful events when you're the losing defender, etc.)
			let ret = [];

			results.forEach((result) => {
				//appending equipment stolen
				if (ret[result.id]) {
					ret[result.id].equipmentStolen.push({
						name: result.equipmentStolenName,
						type: result.equipmentStolenType,
						quantity: result.equipmentStolenQuantity
					});
					return;
				}

				let hideData = req.body.id === result.defenderId && result.success === 'success';

				//creating a new entry
				ret[result.id] = {
					eventTime: result.eventTime,
					attacker: hideData ? null : result.attackerUsername,
					defender: result.defenderUsername,
					attackingUnits: hideData ? null : result.attackingUnits,
					success: result.success,
					spoilsGold: result.spoilsGold,
					equipmentStolen: result.equipmentStolenName ? [{
						name: result.equipmentStolenName,
						type: result.equipmentStolenType,
						quantity: result.equipmentStolenQuantity
					}] : []
				};
			});

			//remove null fields
			ret = ret.filter(x => x);

			//send the build structure
			res.status(200).json(ret);
			res.end();

			log('Spy log sent', JSON.stringify(ret));
		});
	});
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
				let chanceSeen = totalEyes / (pendingSpying.attackingUnits  * 10); //it takes 10 eyes to guarantee the capture of 1 spy, 50% chance to capture 2 spies, etc.

				//if seen (failure)
				if (Math.random() <= chanceSeen) {
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
					let spoilsGold = Math.random() >= 0.5 ? Math.floor(results[0].gold * 0.2) : 0; //50% chance of stealing gold
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

		let successfulSpies = 0;

		for (let i = 0; i < pendingSpying.attackingUnits; i++) {
			//50% chance of stealing equipment
			if (Math.random() >= 0.5) {
				successfulSpies += 1;
			}
		}

		spyStealEquipmentInner(connection, pendingSpying.attackerId, pendingSpying.defenderId, successfulSpies, results[0].id);
	});
};

const spyStealEquipmentInner = (connection, attackerId, defenderId, attackingUnits, pastSpyingId) => {
	//NOTE: steal equipment that isn't being carried by soldiers
	isAttacking(connection, defenderId, (err, attacking) => {
		let query = 'SELECT * FROM equipment WHERE accountId = ?;';
		connection.query(query, [defenderId], (err, results) => {
			if (err) throw err;

			getEquipmentStatistics((err, { statistics }) => {
				if (err) throw err;

				//don't steal certain items
				results = results.filter(item => statistics[item.type][item.name].stealable);

				//if he's not attacking, skip to the next step
				if (!attacking) {
					return spyStealEquipmentSelectItemsToSteal(connection, attackerId, defenderId, attackingUnits, results, pastSpyingId);
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

						//NOTE: Armour stays at home - it's never carried by soldiers (don't call removeForEachSoldier)

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

										spyStealEquipmentSelectItemsToSteal(connection, attackerId, defenderId, attackingUnits, results, pastSpyingId);
									});
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
	getEquipmentStatistics((err, { statistics }) => {
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

		results = results.filter(item => item.quantity > 0);

		cb(undefined, results);
	});
}

const spyStealEquipmentSelectItemsToSteal = (connection, attackerId, defenderId, attackingUnits, results, pastSpyingId) => {
	//count the total items
	let totalItems = 0;
	results.forEach((item) => totalItems += item.quantity);

	let items = [];

	for (let i = 0; i < attackingUnits; i++) {
		//select the specific item to steal
		let selection = Math.floor(Math.random() * totalItems);
		totalItems -= 1;

		//find the exact item that will be stolen (records[0])
		let records = results.filter((item) => {
			selection -= item.quantity;
			return selection < 0;
		});

		//move to items (quantity = 1)
		if (records.length > 0) {
			items.unshift({
				id: records[0].id,
				name: records[0].name,
				type: records[0].type,
				quantity: 1
			});
		}

		//remove it from results (decrement and/or delete)
		for (let i = 0; i < results.length; i++) {
			if (results[i].id === items[0].id) {
				results[i].quantity -= 1;
				if (results[i].quantity <= 0) {
					results.splice(i, 1);
				}
				break;
			}
		}

		//skip the rest
		if (results.length <= 0) {
			break;
		}
	}

	//collapse the {quantity:1} into {quantity:n}
	let collapsedItems = [];

	items.forEach((item) => {
		if (!collapsedItems[item.id]) {
			collapsedItems[item.id] = { ...item };
		} else {
			collapsedItems[item.id].quantity += item.quantity;
		}
	});

	items = []; //clear

	collapsedItems.forEach((record) => {
		items.push(record);
	});

	//next steps
	spyStealEquipmentIncrementItemsToInventory(connection, attackerId, items);
	spyStealEquipmentDecrementItemsFromInventory(connection, defenderId, items);
	recordEquipmentStolen(connection, items, pastSpyingId);
};

const spyStealEquipmentIncrementItemsToInventory = (connection, accountId, items) => {
	//add the items to the players's inventory
	items.forEach((item) => {
		let query = 'SELECT * FROM equipment WHERE accountId = ? AND name = ? AND type = ?;';
		connection.query(query, [accountId, item.name, item.type], (err, results) => {
			if (err) throw err;

			let query;

			//if the player has this item, or not
			if (results.length > 0) {
				query = 'UPDATE equipment SET quantity = quantity + ? WHERE accountId = ? AND name = ? AND type = ?;';
			} else {
				query = 'INSERT INTO equipment (quantity, accountId, name, type) VALUES (?, ?, ?, ?);';
			}

			connection.query(query, [item.quantity, accountId, item.name, item.type], (err) => {
				if (err) throw err;
			});
		});
	});

	//error checking
	items.forEach((item) => {
		let query = 'SELECT * FROM equipment WHERE accountId = ? AND name = ? AND type = ?;';
		connection.query(query, [accountId, item.name, item.type], (err, results) => {
			if (err) throw err;

			if (results.length > 1) {
				log('WARNING: Duplicate items detected', JSON.stringify(results));
			}
		})
	});
};

const spyStealEquipmentDecrementItemsFromInventory = (connection, accountId, items) => {
	//remove these items from the player's inventory
	items.forEach((item) => {
		let query = 'UPDATE equipment SET quantity = quantity - ? WHERE accountId = ? AND id = ?;';
		connection.query(query, [item.quantity, accountId, item.id], (err) => {
			if (err) throw err;
		});
	});

	//check to see if any quantities are negative
	let query = 'SELECT * FROM equipment WHERE quantity < 0;';
	connection.query(query, (err, results) => {
		if (err) throw err;

		if (results.length !== 0) {
			log('WARNING: equipment quantity below zero', JSON.stringify(results));
		}
	});

	//clean the database from quantities of 0
	query = 'DELETE FROM equipment WHERE accountId = ? AND quantity = 0;';
	connection.query(query, [accountId], (err) => {
		if (err) throw err;

		log('Cleaned database', 'equipment decrement');
	});
};

const recordEquipmentStolen = (connection, items, pastSpyingId) => {
	//record in the database
	let query = 'INSERT INTO equipmentStolen (pastSpyingId, name, type, quantity) VALUES (?, ?, ?, ?);';
	items.forEach((item) => {
		connection.query(query, [pastSpyingId, item.name, item.type, item.quantity], (err) => {
			if (err) throw err;

			log('Items stolen', pastSpyingId, JSON.stringify(item));
		});
	});
};

module.exports = {
	spyRequest: spyRequest,
	spyStatusRequest: spyStatusRequest,
	spyLogRequest: spyLogRequest,
	runSpyTick: runSpyTick
};

//TODO: move balance variables to an external file (.env?)