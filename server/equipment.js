//environment variables
require('dotenv').config();

//utilities
let { log } = require('../common/utilities.js');

const statistics = (connection, req, res, cb) => {
	return cb(undefined, { 'statistics': require('./equipment_statistics.json') });
};

const owned = (connection, req, res, cb) => {
	//verify the credentials
	let query = 'SELECT COUNT(*) AS total FROM sessions WHERE accountId = ? AND token = ?;';
	connection.query(query, [req.body.id, req.body.token], (err, results) => {
		if (err) throw err;

		if (results[0].total !== 1) {
			return cb('Invalid equipment owned credentials');
		}

		let query = 'SELECT name, quantity FROM equipment WHERE accountId = ?;';
		connection.query(query, [req.body.id], (err, results) => {
			if (err) throw err;

			let res = {}

			Object.keys(results).map((key) => {
				if (res[results[key].name] !== undefined) {
					log('WARNING: Invalid database state, equipment owned', JSON.stringify(results));
				}
				res[results[key].name] = results[key].quantity;
			});

			return cb(undefined, { 'owned': res });
		});
	});
};

const equipmentRequest = (connection) => (req, res) => {
	//if no field received, send everything
	if (!req.body.field) {
		//compose the returned objects
		statistics(connection, req, res, (err, statisticsObj) => {
			if (err) {
				res.status(400).write(log(err, req.body.id, req.body.token, req.body.field));
				res.end();
				return;
			}

			return owned(connection, req, res, (err, ownedObj) => {
				if (err) {
					res.status(400).write(log(err, req.body.id, req.body.token, req.body.field));
					res.end();
					return;
				}

				//finally, compose the resulting objects
				res.status(200).json(Object.assign({}, statisticsObj, ownedObj));
				res.end();
			});
		});

		return;
	}

	//send specific fields
	switch(req.body.field) {
		case 'statistics':
			return statistics(connection, req, res, (err, obj) => {
				if (err) {
					res.status(400).write(log(err, req.body.id, req.body.token, req.body.field));
				} else {
					res.status(200).json(obj);
				}

				res.end();
			});

		case 'owned':
			return owned(connection, req, res, (err, obj) => {
				if (err) {
					res.status(400).write(log(err, req.body.id, req.body.token, req.body.field));
				} else {
					res.status(200).json(obj);
				}

				res.end();
			});

		default:
			res.status(400).write(log('Unknown field received', req.body.id, req.body.token, req.body.field));
			res.end();
	}
};

module.exports = {
	equipmentRequest: equipmentRequest
};