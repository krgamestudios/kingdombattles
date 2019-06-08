//environment variables
require('dotenv').config();

//utilities
let { log } = require('../common/utilities.js');

let { logActivity, getBadgesStatistics, getBadgesOwned } = require('./utilities.js');

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
			res.status(400).write(log('Invalid active badge select credentials', JSON.stringify(body), body.id, body.token));
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

const rewardBadge = (connection, id, badgeName) => {
	//TODO: constants as badge/equipment names?
	let query = 'INSERT IGNORE badges (accountId, name) VALUES (?, ?);';
	connection.query(query, [id, badgeName], (err) => {
		if (err) throw err;
	});
};

module.exports = {
	listRequest: listRequest,
	ownedRequest: ownedRequest,
	selectActiveBadge: selectActiveBadge,
	rewardBadge: rewardBadge
};