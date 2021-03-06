//environment variables
require('dotenv').config();

//utilities
let { log } = require('../common/utilities.js');

const getEquipmentStatistics = (cb) => {
	//TODO: apiVisible field
	return cb(undefined, { 'statistics': require('./equipment_statistics.json') });
};

const getEquipmentOwned = (connection, id, cb) => {
	let query = 'SELECT name, quantity FROM equipment WHERE accountId = ?;';
	connection.query(query, [id], (err, results) => {
		if (err) throw err;

		let ret = {};

		Object.keys(results).map((key) => {
			if (ret[results[key].name] !== undefined) {
				log('WARNING: Invalid database state, equipment owned', id, JSON.stringify(results));
			}
			ret[results[key].name] = results[key].quantity;
		});

		return cb(undefined, { 'owned': ret });
	});
};

const getBadgesStatistics = (cb) => {
	//TODO: apiVisible field
	return cb(undefined, { 'statistics': require('./badge_statistics.json') });
};

const getBadgesOwned = (connection, id, cb) => {
	let query = 'SELECT name, active FROM badges WHERE accountId = ?;';
	connection.query(query, [id], (err, results) => {
		if (err) throw err;

		let ret = {}; //names, active

		Object.keys(results).map((key) => {
			if (ret[results[key].name] !== undefined) {
				log('WARNING: Invalid database state, badges owned', id, JSON.stringify(results));
			}
			ret[results[key].name] = { active: results[key].active };
		});

		//NOTE: check for "Capture The Flag" badge, force it to be the active badge
		if ("Capture The Flag" in ret) {
			Object.keys(ret).map((key) => ret[key].active = false);
			ret["Capture The Flag"].active = true;
		}

		return cb(undefined, { 'owned': ret });
	});
}

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
		return cb(`isAttacking: Unknown argument type for user: ${typeof(user)}`);
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

const isSpying = (connection, user, cb) => {
	let query;

	if (isNormalInteger(user)) {
		query = 'SELECT * FROM pendingSpying WHERE attackerId = ?;';
	} else if (typeof(user) === 'string') {
		query = 'SELECT * FROM pendingSpying WHERE attackerId IN (SELECT id FROM accounts WHERE username = ?);';
	} else {
		return cb(`isSpying: Unknown argument type for user: ${typeof(user)}`);
	}

	connection.query(query, [user], (err, results) => {
		if (err) throw err;

		if (results.length === 0) {
			return cb(undefined, false);
		} else {
			//get the username of the person being spied on
			let query = 'SELECT username FROM accounts WHERE id = ?;';
			connection.query(query, [results[0].defenderId], (err, results) => {
				if (err) throw err;
				return cb(undefined, true, results[0].username);
			});
		}
	});
};

const getLadderData = (connection, field, start, length, cb) => {
	//moved here for reusability
	//TODO: implement the field parameter
	let query = 'SELECT accounts.id AS id, username, soldiers, recruits, gold FROM accounts JOIN profiles ON accounts.id = profiles.accountId ORDER BY -ladderRank DESC LIMIT ?, ?;';
	connection.query(query, [Math.max(0, start || 0), Math.max(0, length || 0)], (err, results) => {
		cb(err, results);
	});
};

const logActivity = (connection, id) => {
	let query = 'UPDATE accounts SET lastActivityTime = CURRENT_TIMESTAMP() WHERE id = ?;';
	connection.query(query, [id], (err) => {
		if (err) throw err;
	});
};

module.exports = {
	getEquipmentStatistics: getEquipmentStatistics,
	getEquipmentOwned: getEquipmentOwned,
	getBadgesStatistics: getBadgesStatistics,
	getBadgesOwned: getBadgesOwned,
	isAttacking: isAttacking,
	isSpying: isSpying,
	getLadderData: getLadderData,
	logActivity: logActivity
};