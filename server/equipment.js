//environment variables
require('dotenv').config();

//utilities
let { log } = require('../common/utilities.js');

//the statistics
let equipmentStatistics = require('./equipment_statistics.json');

const statisticsRequest = () => (req, res) => {
	res.status(200).json(equipmentStatistics);
	res.end();
}

const listRequest = (connection) => (req, res) => {
	//verify identity
	let query = 'SELECT accountId FROM sessions WHERE accountId IN (SELECT id FROM accounts WHERE username = ?) AND token = ?;';
	connection.query(query, [req.body.username, req.body.token], (err, results) => {
		if (err) throw err;

		let query = 'SELECT name, quantity, type FROM equipment WHERE accountId = ?;';
		connection.query(query, [results[0].accountId], (err, results) => {
			if (err) throw err;

			//transform the results into a sendable array
			let list = {};

			results.map((record) => {
				//initialize this type
				list[record.type] = list[record.type] || {};

				//send the quantity of every type
				list[record.type][record.name] = record.quantity;
			});

			res.status(200).json(list);
			res.end();
		});
	});
}

module.exports = {
	statisticsRequest: statisticsRequest,
	listRequest: listRequest
}