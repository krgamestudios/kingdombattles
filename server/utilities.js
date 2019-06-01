//environment variables
require('dotenv').config();

//utilities
let { log } = require('../common/utilities.js');

const getStatistics = (cb) => {
	//TODO: apiVisible field
	return cb(undefined, { 'statistics': require('./equipment_statistics.json') });
};

const getOwned = (connection, id, cb) => {
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
	getStatistics: getStatistics,
	getOwned: getOwned,
	isAttacking: isAttacking
};