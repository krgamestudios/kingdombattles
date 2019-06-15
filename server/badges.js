//environment variables
require('dotenv').config();

//libraries
let CronJob = require('cron').CronJob;

//utilities
let { log } = require('../common/utilities.js');

let { logActivity, getBadgesStatistics, getBadgesOwned, getLadderData } = require('./utilities.js');

const listRequest = (connection) => (req, res) => {
	getBadgesStatistics((err, results) => {
		if (err) throw err;

		res.status(200).json(results);
		res.end();

		log('Badge list sent');
	});
}

const ownedRequest = (connection) => (req, res) => {
	//validate the credentials
	let query = 'SELECT COUNT(*) AS total FROM sessions WHERE accountId = ? AND token = ?;';
	connection.query(query, [req.body.id, req.body.token], (err, credentials) => {
		if (err) throw err;

		if (credentials[0].total !== 1) {
			res.status(400).write(log('Invalid badges owned credentials', JSON.stringify(req.body), req.body.id, req.body.token));
			res.end();
			return;
		}

		//get stats and owned
		getBadgesStatistics((err, badgesStatistics) => {
			if (err) throw err;

			getBadgesOwned(connection, req.body.id, (err, badgesOWned) => {
				if (err) throw err;

				res.status(200).json(Object.assign({}, badgesStatistics, badgesOWned));
				res.end();

				log('Badges owned sent', req.body.id);
			});
		});
	});
}

const selectActiveBadge = (connection) => (req, res) => {
	//validate the credentials
	let query = 'SELECT COUNT(*) AS total FROM sessions WHERE accountId = ? AND token = ?;';
	connection.query(query, [req.body.id, req.body.token], (err, credentials) => {
		if (err) throw err;

		if (credentials[0].total !== 1) {
			res.status(400).write(log('Invalid active badge select credentials', req.body.id, req.body.token));
			res.end();
			return;
		}

		//check to see if the player owns this badge
		getBadgesOwned(connection, req.body.id, (err, { owned }) => {
			if (err) throw err;

			if (req.body.name !== null && !owned[req.body.name]) {
				res.status(400).write('You don\'t own that badge');
				res.end();
				return;
			}

			//if Capture The Flag is active, don't change the active badge; return badges owned
			if (owned["Capture The Flag"]) {
				getBadgesOwned(connection, req.body.id, (err, results) => {
					if (err) throw err;
					res.status(200).json(results);
					res.end();
				});
				return;
			}

			//zero out the user's selection
			let query = 'UPDATE badges SET active = FALSE WHERE accountId = ?;';
			connection.query(query, [req.body.id], (err) => {
				if (err) throw err;

				//update the user's selection
				let query = 'UPDATE badges SET active = TRUE WHERE accountId = ? AND name = ?;';
				connection.query(query, [req.body.id, req.body.name], (err) => {
					if (err) throw err;

					//re-grab the owned badges (with updated info)
					getBadgesOwned(connection, req.body.id, (err, results) => {
						if (err) throw err;

						res.status(200).json(results);
						res.end();

						log('Updated badge selection', req.body.id, req.body.name);
						logActivity(connection, req.body.id);
					});
				});
			});
		});
	});
};

const rewardBadge = (connection, id, badgeName, cb) => {
	//TODO: constants as badge/equipment names?
	let query = 'INSERT INTO badges (accountId, name) SELECT ?, ? FROM DUAL WHERE NOT EXISTS(SELECT 1 FROM badges WHERE accountId = ? AND name = ?);';
	connection.query(query, [id, badgeName, id, badgeName], (err, packet) => {
		if (err) throw err;

		if (packet.affectedRows) {
			cb(id, badgeName);
		}
	});
};

const captureTheFlag = (connection, attackerId, defenderId, skip, cb) => {
	//if this is a no-op
	if (skip) {
		return cb(false);
	}

	//check to see if the flag belongs to the defender
	let query = 'SELECT * FROM badges WHERE accountId = ? AND name = "Capture The Flag" LIMIT 1;';
	connection.query(query, [defenderId], (err, results) => {
		if (err) throw err;

		//does the defender have this badge? If not, return
		if (results.length === 0) {
			return cb(false);
		}

		//move the badge between accounts
		let query = 'INSERT INTO badges (id, accountId, name, active) VALUES (?, ?, "Capture The Flag", FALSE) ON DUPLICATE KEY UPDATE accountId = VALUES(accountId), active = FALSE;';
		connection.query(query, [results[0].id, attackerId], (err) => {
			if (err) throw err;

			log('Badge moved', attackerId, defenderId);
			cb(true);
		});
	});
};

const runBadgeTicks = (connection) => {
	//Combat Master
	let combatMasterBadgeTickJob = new CronJob('0 * * * * *', () => { //once a minute - combats aren't that fast
		//gather the total combats
		let query = 'SELECT * FROM (SELECT attackerId, COUNT(attackerId) AS successfulAttacks FROM pastCombat WHERE victor = "attacker" GROUP BY attackerId ORDER BY attackerId) AS t WHERE successfulAttacks >= 100;';
		connection.query(query, (err, results) => {
			if (err) throw err;

			for (let i = 0; i < results.length; i++) {
				rewardBadge(connection, results[i].attackerId, 'Combat Master', (id, badgeName) => log('Badge rewarded', id, badgeName));
			}
		});
	});

	combatMasterBadgeTickJob.start();

	//King Of The Hill
	let kingOfTheHillBadgeTickJob = new CronJob('0 * * * * *', () => { //once a minute
		//NOTE: sloppy implementation - people who have the badge may get "rewarded" twice. Thankfully rewardBadge() prevents this.
		getLadderData(connection, 'parameter not used (yet)', 0, 1, (err, ladderResults) => {
			if (err) throw err; //TODO: pull badge names into variables. Not good.

			//only happens with 0 players, but might as well check
			if (ladderResults.length === 0) {
				log('No players in ladder');
				return;
			}

			//get the current contender for king of the hill
			let query = 'SELECT * FROM badgesTimespan WHERE name = "King Of The Hill";';
			connection.query(query, (err, results) => {
				if (err) throw err;

				const day = 1000*60*60*24; //milliseconds
				const now = new Date();
				const qualifyTime = results.length > 0 ? new Date(results[0].qualifyTime) : null;

				//if someone qualifies (1 day)
				if (results.length > 0 && now - qualifyTime >= day) {
					rewardBadge(connection, results[0].accountId, results[0].name, (id, badgeName) => log("Badge rewarded", id, badgeName));
					let query = 'DELETE FROM badgesTimespan WHERE id = ?;';
					connection.query(query, [results[0].id], (err) => {
						if (err) throw err;
					});
					return;
				}

				//if someone is still a contender for this badge
				if (results.length > 0 && ladderResults[0].id === results[0].accountId) {
					//DO NOTHING
					log('King Of The Hill contender found', ladderResults[0].id, ladderResults[0].username);
				}

				//if the current contender is NOT in first place
				else {
					let query = 'DELETE FROM badgesTimespan WHERE name = "King Of The Hill";';
					connection.query(query, (err) => {
						if (err) throw err;

						let query = 'INSERT INTO badgesTimespan (accountId, name) VALUES (?, "King Of The Hill")';
						connection.query(query, [ladderResults[0].id], (err) => {
							if (err) throw err;

							log('King Of The Hill contender updated', ladderResults[0].id, ladderResults[0].username);
						});
					});
				}
			});
		});
	});

	kingOfTheHillBadgeTickJob.start();
}

module.exports = {
	listRequest: listRequest,
	ownedRequest: ownedRequest,
	selectActiveBadge: selectActiveBadge,
	rewardBadge: rewardBadge,
	captureTheFlag: captureTheFlag,
	runBadgeTicks: runBadgeTicks
};