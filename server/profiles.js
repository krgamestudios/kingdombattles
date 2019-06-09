//environment variables
require('dotenv').config();

//libraries
let CronJob = require('cron').CronJob;

let { getBadgesStatistics, getBadgesOwned, isAttacking, isSpying, getLadderData, logActivity } = require('./utilities.js');

//utilities
let { logDiagnostics } = require('./diagnostics.js');
let { log } = require('../common/utilities.js');

//profile creation & requesting
const profileCreateRequest = (connection) => (req, res) => {
	//separate this section so it can be used elsewhere too
	return profileCreateRequestInner(connection, req, res, req.body);
};

function profileCreateRequestInner(connection, req, res, body) {
	let query = 'SELECT accountId FROM profiles WHERE accountId IN (SELECT accounts.id FROM accounts WHERE username = ?);';
	connection.query(query, [body.username], (err, results) => {
		if (err) throw err;

		if (results.length === 1) {
			res.status(400).write(log('That profile already exists', body.username));
			res.end();
			return;
		}

		//check ID, username and token match (only the profile's owner can create it)
		let query = 'SELECT accountId FROM sessions WHERE accountId IN (SELECT id FROM accounts WHERE username = ?) AND token = ?;';
		connection.query(query, [body.username, body.token], (err, results) => {
			if (err) throw err;

			if (results.length !== 1 || results[0].accountId != body.id) {
				res.status(400).write(log('Invalid profile creation credentials', body.username, body.id, body.token));
				res.end();
				return;
			}

			//create the profile
			let query = 'INSERT INTO profiles (accountId) SELECT accounts.id FROM accounts WHERE username = ?;';
			connection.query(query, [body.username], (err) => {
				if (err) throw err;

				log('Profile created', body.username, body.id, body.token);
				logActivity(connection, body.id);

				return profileRequestInner(connection, req, res, body);
			});
		});
	});
};

const profileRequest = (connection) => (req, res) => {
	//separate this section so it can be used elsewhere too
	return profileRequestInner(connection, req, res, req.body);
};

function profileRequestInner(connection, req, res, body) {
	//find the profile
	let query = 'SELECT * FROM profiles WHERE accountId IN (SELECT accounts.id FROM accounts WHERE username = ?);';
	connection.query(query, [body.username], (err, results) => {
		if (err) throw err;

		if (results.length !== 1) {
			//pass it off to the profile creation process, IF the user is requesting their own profile
			let query = 'SELECT id FROM accounts WHERE id = ? AND id IN (SELECT accountId FROM sessions WHERE token = ?);';
			connection.query(query, [body.id, body.token], (err, results) => {
				if (err) throw err;

				if (results.length === 1) {
					return profileCreateRequestInner(connection, req, res, body);
				} else {
					res.status(400).write(log('Profile not found', body.username, body.id, body.token));
					res.end();
				}
			});
		} else {
			getBadgesOwned(connection, results[0].accountId, (err, { owned }) => {
				if (err) throw err;

				getBadgesStatistics((err, { statistics }) => {
					if (err) throw err;

					let activeBadge = Object.keys(owned).find(name => owned[name].active) || null;

					res.status(200).json({
						username: body.username,
						gold: results[0].gold,
						recruits: results[0].recruits,
						soldiers: results[0].soldiers,
						spies: results[0].spies,
						scientists: results[0].scientists,
						activeBadge: activeBadge,
						activeBadgeFilename: activeBadge ? statistics[activeBadge].filename : null
					});
					res.end();
					log('Profile sent', body.username, body.id, body.token);
				});
			});
		}
	});
};

//actual actions to be taken
const recruitRequest = (connection) => (req, res) => {
	//verify the credentials
	let query = 'SELECT COUNT(*) AS total FROM sessions WHERE accountId = ? AND token = ?;';
	connection.query(query, [req.body.id, req.body.token], (err, results) => {
		if (err) throw err;

		if (results[0].total !== 1) {
			res.status(400).write(log('Invalid recruit credentials - 1', req.body.id, req.body.token));
			res.end();
			return;
		}

		//verify enough time has passed since the last successful recruit action
		let query = 'SELECT TIMESTAMPDIFF(HOUR, (SELECT lastRecruitTime FROM profiles WHERE accountId = ?), CURRENT_TIMESTAMP());';
		connection.query(query, [req.body.id], (err, results) => {
			if (err) throw err;

			if (results.length !== 1) {
				res.status(400).write(log('Invalid database state', req.body.id, req.body.token));
				res.end();
				return;
			}

			let timespans = results[0][Object.keys(results[0])];

			//not enough time has passed
			if (timespans < 20) {
				res.status(400).write(log('Not enough time has passed', req.body.id, req.body.token));
				res.end();
				return;
			}

			//update the profile with the new data (gaining 1 recruit)
			let query = 'UPDATE profiles SET recruits = recruits + 1, lastRecruitTime = CURRENT_TIMESTAMP() WHERE accountId	= ?;';
			connection.query(query, [req.body.id], (err) => {
				if (err) throw err;

				//send the new profile data as JSON
				let query = 'SELECT username, profiles.* FROM profiles JOIN accounts ON accounts.id = profiles.accountId WHERE accounts.id = ?;';
				connection.query(query, [req.body.id], (err, results) => {
					if (err) throw err;

						//check just in case
					if (results.length !== 1) {
						res.status(400).write(log('Invalid recruit credentials - 2', req.body.id, req.body.token));
						res.end();
						return;
					}

					getBadgesOwned(connection, results[0].accountId, (err, { owned }) => {
						if (err) throw err;

						getBadgesStatistics((err, { statistics }) => {
							if (err) throw err;

							let activeBadge = Object.keys(owned).find(name => owned[name].active) || null;

							res.status(200).json({
								username: results[0].username,
								gold: results[0].gold,
								recruits: results[0].recruits,
								soldiers: results[0].soldiers,
								spies: results[0].spies,
								scientists: results[0].scientists,
								activeBadge: activeBadge,
								activeBadgeFilename: activeBadge ? statistics[activeBadge].filename : null
							});
							res.end();

							log('Recruit successful', results[0].username, req.body.id, req.body.token);
							logDiagnostics(connection, 'recruit', 1);
							logActivity(connection, req.body.id);
						});
					});
				});
			});
		});
	});
};

const trainRequest = (connection) => (req, res) => {
	//verify the credentials (NOTE: duplication)
	let query = 'SELECT COUNT(*) AS total FROM sessions WHERE accountId = ? AND token = ?;';
	connection.query(query, [req.body.id, req.body.token], (err, results) => {
		if (err) throw err;

		if (results[0].total !== 1) {
			res.status(400).write(log('Invalid train credentials - 1', req.body.id, req.body.token));
			res.end();
			return;
		}

		//verify the role argument
		if (req.body.role !== 'soldier' && req.body.role !== 'spy' && req.body.role !== 'scientist') {
			res.status(400).write(log('Invalid train parameters', req.body.role, req.body.id, req.body.token));
			res.end();
			return;
		}

		//can't train while attacking
		isAttacking(connection, req.body.id, (err, attacking) => {
			if (err) throw err;

			if (attacking) {
				res.status(400).write(log('Can\'t train while attacking', req.body.id));
				res.end();
				return;
			}

			isSpying(connection, req.body.id, (err, spying) => {
				if (err) throw err;

				if (spying) {
					res.status(400).write(log('Can\'t train while spying', req.body.id));
					res.end();
					return;
				}

				//determine the cost of the training TODO: make these global for the client too
				let cost = 0;
				switch(req.body.role) {
					case 'soldier':
						cost = 100;
						break;

					case 'spy':
						cost = 300;
						break;

					case 'scientist':
						cost = 120;
						break;
				}

				//verify that the user has a high enough gold and recruit balance
				let query = 'SELECT recruits, gold FROM profiles WHERE accountId = ?;';
				connection.query(query, [req.body.id], (err, results) => {
					if (err) throw err;

					if (results[0].recruits <= 0) {
						res.status(400).write(log('Not enough recruits', results[0].recruits, req.body.id, req.body.token));
						res.end();
						return;
					}

					if (results[0].gold < cost) {
						res.status(400).write(log('Not enough gold', results[0].gold, req.body.id, req.body.token));
						res.end();
						return;
					}

					//update the profile with new values (NOTE: extra protection for network latency)
					let query = 'UPDATE profiles SET gold = gold - ?, recruits = recruits - 1, soldiers = soldiers + ?, spies = spies + ?, scientists = scientists + ? WHERE accountId = ? AND gold >= ? AND recruits > 0;';
					connection.query(query, [cost, req.body.role === 'soldier' ? 1 : 0, req.body.role === 'spy' ? 1 : 0, req.body.role === 'scientist' ? 1 : 0, req.body.id, cost], (err) => {
						if (err) throw err;

						//send the new profile data as JSON (NOTE: possible duplication)
						let query = 'SELECT username, profiles.* FROM profiles JOIN accounts ON accounts.id = profiles.accountId WHERE accounts.id = ?;';
						connection.query(query, [req.body.id], (err, results) => {
							if (err) throw err;

							//check just in case
							if (results.length !== 1) {
								res.status(400).write(log('Invalid recruit credentials - 2', req.body.id, req.body.token));
								res.end();
								return;
							}

							getBadgesOwned(connection, results[0].accountId, (err, { owned }) => {
								if (err) throw err;

								getBadgesStatistics((err, { statistics }) => {
									if (err) throw err;

									let activeBadge = Object.keys(owned).find(name => owned[name].active) || null;

									res.status(200).json({
										username: results[0].username,
										gold: results[0].gold,
										recruits: results[0].recruits,
										soldiers: results[0].soldiers,
										spies: results[0].spies,
										scientists: results[0].scientists,
										activeBadge: activeBadge,
										activeBadgeFilename: activeBadge ? statistics[activeBadge].filename : null
									});
									res.end();

									log('Train executed', results[0].username, req.body.role, req.body.id, req.body.token);
									logActivity(connection, req.body.id);
								});
							});
						});
					});
				});
			});
		});
	});
};

const untrainRequest = (connection) => (req, res) => {
	//verify the credentials (NOTE: duplication)
	let query = 'SELECT accountId FROM sessions WHERE accountId = ? AND token = ?;';
	connection.query(query, [req.body.id, req.body.token], (err, results) => {
		if (err) throw err;

		if (results.length !== 1) {
			res.status(400).write(log('Invalid untrain credentials - 1', req.body.role, req.body.id, req.body.token));
			res.end();
			return;
		}

		//verify the role argument
		if (req.body.role !== 'soldier' && req.body.role !== 'spy' && req.body.role !== 'scientist') {
			res.status(400).write(log('Invalid untrain parameters', req.body.role, req.body.id, req.body.token));
			res.end();
			return;
		}

		//can't untrain while attacking
		isAttacking(connection, req.body.id, (err, attacking) => {
			if (err) throw err;
			
			if (attacking) {
				res.status(400).write(log('Can\'t untrain while attacking', req.body.id, req.body.token));
				res.end();
				return;
			}

			isSpying(connection, req.body.id, (err, spying) => {
				if (err) throw err;

				if (spying) {
					res.status(400).write(log('Can\'t untrain while spying', req.body.id, req.body.token));
					res.end();
					return;
				}

				//verify that the user has a high enough balance
				let query = 'SELECT soldiers, spies, scientists FROM profiles WHERE accountId = ?;';
				connection.query(query, [req.body.id], (err, results) => {
					if (err) throw err;

					if (req.body.role === 'soldier' && results[0].soldiers <= 0) {
						res.status(400).write(log('Not enough soldiers', results[0].soldiers, req.body.id, req.body.token));
						res.end();
						return;
					}

					if (req.body.role === 'spy' && results[0].spies <= 0) {
						res.status(400).write(log('Not enough spies', results[0].spies, req.body.id, req.body.token));
						res.end();
						return;
					}

					if (req.body.role === 'scientist' && results[0].scientists <= 0) {
						res.status(400).write(log('Not enough scientists', results[0].scientists, req.body.id, req.body.token));
						res.end();
						return;
					}

					//hacky
					let roleName = null;

					if (req.body.role === 'soldier') {
						roleName = 'soldiers';
					} else if (req.body.role === 'spy') {
						roleName = 'spies';
					} else if (req.body.role === 'scientist') {
						roleName = 'scientists';
					} else {
						res.status(400).write(log('Unknown role received', req.body.role, req.body.id, req.body.token));
						res.end();
						return;
					}

					//update the profile with new values (NOTE: extra protection for network latency)
					let query = `UPDATE profiles SET recruits = recruits + 1, soldiers = soldiers - ?, spies = spies - ?, scientists = scientists - ? WHERE accountId = ? AND ${roleName} > 0;`;
					connection.query(query, [roleName === 'soldiers' ? 1 : 0, roleName === 'spies' ? 1 : 0, roleName === 'scientists' ? 1 : 0, req.body.id], (err) => {
						if (err) throw err;

						//send the new profile data as JSON (NOTE: possible duplication)
						let query = 'SELECT username, profiles.* FROM profiles JOIN accounts ON accounts.id = profiles.accountId WHERE accounts.id = ?;';
						connection.query(query, [req.body.id], (err, results) => {
							if (err) throw err;

							//check just in case
							if (results.length !== 1) {
								res.status(400).write(log('Invalid untrain credentials - 2', req.body.role, req.body.id, req.body.token));
								res.end();
								return;
							}

							getBadgesOwned(connection, results[0].accountId, (err, { owned }) => {
								if (err) throw err;

								getBadgesStatistics((err, { statistics }) => {
									if (err) throw err;

									let activeBadge = Object.keys(owned).find(name => owned[name].active) || null;

									res.status(200).json({
										username: results[0].username,
										gold: results[0].gold,
										recruits: results[0].recruits,
										soldiers: results[0].soldiers,
										spies: results[0].spies,
										scientists: results[0].scientists,
										activeBadge: activeBadge,
										activeBadgeFilename: activeBadge ? statistics[activeBadge].filename : null
									});
									res.end();

									log('Untrain executed', results[0].username, roleName, req.body.id, req.body.token);
									logActivity(connection, req.body.id);
								});
							});
						});
					});
				});
			});
		});
	});
};

const ladderRequest = (connection) => (req, res) => {
	getLadderData(connection, req.body.start, req.body.length, (err, results) => {
		if (err) throw err;

		getBadgesStatistics((err, { statistics }) => {
			if (err) throw err;

			//BUGFIX
			if (results.length === 0) {
				res.status(200).json([]);
				res.end();
			}

			for(let i = 0; i < results.length; i++) {
				getBadgesOwned(connection, results[i].id, (err, { owned }) => {
					if (err) throw err;

					results[i].activeBadge = Object.keys(owned).find(name => owned[name].active) || null;
					results[i].activeBadgeUrl = results[i].activeBadge ? statistics[results[i].activeBadge].filename : null;

					//don't share IDs
					delete results[i].id;

					//weird, because of async
					if (i + 1 === results.length) {
						res.status(200).json(results);
						res.end();
						log('Ladder sent', req.body.start, req.body.length, results);
					}
				});
			}
		});
	});
};

const runGoldTick = (connection) => {
	//gotta love closures
	let goldTickJob;
	let oldTickRate;

	//run outer tick once a minute, 30 seconds after goldTickJob to prevent clashes
	let outerTick = new CronJob('30 * * * * *', () => {
		log('outerTick');

		let query = 'SELECT SUM(gold) / COUNT(*) AS goldAverage FROM profiles;';
		connection.query(query, (err, results) => {
			if (err) throw err;

			//determine the correct tick rate based on the current gold average
			let tickRate = (() => {
				if (results[0].goldAverage < 120) return 5;
				if (results[0].goldAverage < 130) return 15;
				if (results[0].goldAverage < 140) return 30;
				return 60; //slow it way down
			})();

			//if the tick rate changed (or is undefined), reset (or start) the inner tick job
			if (oldTickRate !== tickRate) {
				if (goldTickJob) goldTickJob.stop();

				goldTickJob = new CronJob(`0 */${tickRate} * * * *`, () => {
					let query = 'UPDATE profiles SET gold = gold + recruits;';
					connection.query(query, (err) => {
						if (err) throw err;

						//re-fetch the new gold average for logging
						let query = 'SELECT SUM(gold) / COUNT(*) AS goldAverage FROM profiles;';
						connection.query(query, (err, results) => {
							if (err) throw err;
							log('goldTickJob', tickRate, results[0].goldAverage);
						});
					});
				});

				goldTickJob.start();

				oldTickRate = tickRate;
			}
		});
	});

	outerTick.start();
};

module.exports = {
//	profileCreate: profileCreate, //NOTE: Not actually used
	profileRequest: profileRequest,
	recruitRequest: recruitRequest,
	trainRequest: trainRequest,
	untrainRequest: untrainRequest,
	ladderRequest: ladderRequest,
	runGoldTick: runGoldTick
};