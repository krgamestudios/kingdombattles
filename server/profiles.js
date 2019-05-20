//environment variables
require('dotenv').config();

//libraries
let formidable = require('formidable');
let CronJob = require('cron').CronJob;

//profile creation & requesting
const profileCreate = (connection) => (req, res) => {
	//formidable handles forms
	let form = formidable.IncomingForm();

	//parse form
	form.parse(req, (err, fields) => {
		if (err) throw err;

		//separate this section so it can be used elsewhere too
		return profileCreateInner(connection, req, res, fields);
	});
}

function profileCreateInner(connection, req, res, fields) {
	let query = 'SELECT accountId FROM profiles WHERE accountId IN (SELECT accounts.id FROM accounts WHERE username = ?);';
	connection.query(query, [fields.username], (err, results) => {
		if (err) throw err;

		if (results.length === 1) {
			res.status(400).write('That profile already exists');
			res.end();
			return;
		}

		//check ID, username and token match
		let query = 'SELECT accountId FROM sessions WHERE accountId IN (SELECT id FROM accounts WHERE username = ?) AND token = ?;';
		connection.query(query, [fields.username, fields.token], (err, results) => {
			if (err) throw err;

			if (results.length !== 1 || results[0].accountId != fields.id) {
				res.status(400).write('Invalid profile creation credentials');
				res.end();
				return;
			}

			let query = 'INSERT INTO profiles (accountId) SELECT accounts.id FROM accounts WHERE username = ?;';
			connection.query(query, [fields.username], (err) => {
				if (err) throw err;

				return profileRequestInner(connection, req, res, fields);
			});
		});
	});
}

const profileRequest = (connection) => (req, res) => {
	//formidable handles forms
	let form = formidable.IncomingForm();

	//parse form
	form.parse(req, (err, fields) => {
		if (err) throw err;

		//separate this section so it can be used elsewhere too
		return profileRequestInner(connection, req, res, fields);
	});
};

function profileRequestInner(connection, req, res, fields) {
	let query = 'SELECT * FROM profiles WHERE accountId IN (SELECT accounts.id FROM accounts WHERE username = ?);';
	connection.query(query, [fields.username], (err, results) => {
		if (err) throw err;

		if (results.length !== 1) {
			//pass it off to the profile creation process, IF the user is requesting their own profile
			let query = 'SELECT id FROM accounts WHERE id = ? AND id IN (SELECT accountId FROM sessions WHERE token = ?);';
			connection.query(query, [fields.id, fields.token], (err, results) => {
				if (err) throw err;

				if (results.length === 1) {
					return profileCreateInner(connection, req, res, fields);
				} else {
					res.status(400).write('Profile not found');
					res.end();
				}
			});
		} else {
			//results.length === 1
			res.status(200).json({
				username: fields.username,
				gold: results[0].gold,
				recruits: results[0].recruits,
				soldiers: results[0].soldiers,
				spies: results[0].spies,
				scientists: results[0].scientists
			});
			res.end();
		}
	});
}

//actual actions to be taken
const recruit = (connection) => (req, res) => {
	//formidable handles forms
	let form = formidable.IncomingForm();

	//parse form
	form.parse(req, (err, fields) => {
		if (err) throw err;

		//verify the credentials
		let query = 'SELECT accountId FROM sessions WHERE accountId = ? AND token = ?;';
		connection.query(query, [fields.id, fields.token], (err, results) => {
			if (err) throw err;

			if (results.length !== 1) {
				res.status(400).write('Invalid recruit credentials');
				res.end();
				return;
			}

			//verify enough time has passed since the last successful recruit action
			let query = 'SELECT TIMESTAMPDIFF(HOUR, (SELECT lastRecruitTime FROM profiles WHERE accountId = ?), CURRENT_TIMESTAMP());';
			connection.query(query, [fields.id], (err, results) => {
				if (err) throw err;

				if (results.length !== 1) {
					res.status(400).write('Invalid database state'); //TODO: internal error logging
					res.end();
					return;
				}

				let timespans = results[0][Object.keys(results[0])];

				//not enough time has passed
				if (timespans < 22) {
					res.status(400).write('Not enough time has passed');
					res.end();
					return;
				}

				//update the profile with the new data (gaining 1 recruit)
				let query = 'UPDATE profiles SET recruits = recruits + 1, lastRecruitTime = CURRENT_TIMESTAMP() WHERE accountId	= ?;';
				connection.query(query, [fields.id], (err) => {
					if (err) throw err;

					//send the new profile data as JSON (NOTE: possible duplication)
					let query = 'SELECT * FROM profiles WHERE accountId = ?;';
					connection.query(query, [fields.id], (err, results) => {
						if (err) throw err;

						//check just in case
						if (results.length !== 1) {
							res.status(400).write('Invalid recruit credentials');
							res.end();
							return;
						}

						//results.length === 1
						res.status(200).json({
							username: fields.username, //TODO: join here
							gold: results[0].gold,
							recruits: results[0].recruits,
							soldiers: results[0].soldiers,
							spies: results[0].spies,
							scientists: results[0].scientists
						});
						res.end();
					});
				});
			});
		});
	});
}

const train = (connection) => (req, res) => {
	//formidable handles forms
	let form = formidable.IncomingForm();

	//parse form
	form.parse(req, (err, fields) => {
		if (err) throw err;

		//verify the credentials (NOTE: duplication)
		let query = 'SELECT accountId FROM sessions WHERE accountId = ? AND token = ?;';
		connection.query(query, [fields.id, fields.token], (err, results) => {
			if (err) throw err;

			if (results.length !== 1) {
				res.status(400).write('Invalid train credentials');
				res.end();
				return;
			}

			//verify the role argument
			if (fields.role !== 'soldier' && fields.role !== 'spy' && fields.role !== 'scientist') {
				res.status(400).write('Invalid train parameters');
				res.end();
				return;
			}

			//determine the cost of the training
			let cost = 0;
			switch(fields.role) {
				case 'soldier':
					cost = 100;
					break;

				case 'spy':
					cost = 200;
					break;

				case 'scientist':
					cost = 120;
					break;
			}

			//verify that the user has a high enough gold and recruit balance
			let query = 'SELECT recruits, gold FROM profiles WHERE accountId = ?;';
			connection.query(query, [fields.id], (err, results) => {
				if (err) throw err;

				if (results[0].recruits <= 0) {
					res.status(400).write('Not enough recruits');
					res.end();
					return;
				}

				if (results[0].gold < cost) {
					res.status(400).write('Not enough gold');
					res.end();
					return;
				}

				//update the profile with new values
				let query = 'UPDATE profiles SET gold = gold - ?, recruits = recruits - 1, soldiers = soldiers + ?, spies = spies + ?, scientists = scientists + ? WHERE accountId = ?;';
				connection.query(query, [cost, fields.role === 'soldier' ? 1 : 0, fields.role === 'spy' ? 1 : 0, fields.role === 'scientist' ? 1 : 0, fields.id], (err) => {
					if (err) throw err;

					//send the new profile data as JSON (NOTE: possible duplication)
					let query = 'SELECT * FROM profiles WHERE accountId = ?;';
					connection.query(query, [fields.id], (err, results) => {
						if (err) throw err;

						//check just in case
						if (results.length !== 1) {
							res.status(400).write('Invalid recruit credentials');
							res.end();
							return;
						}

						//results.length === 1
						res.status(200).json({
							username: fields.username, //TODO: join here
							gold: results[0].gold,
							recruits: results[0].recruits,
							soldiers: results[0].soldiers,
							spies: results[0].spies,
							scientists: results[0].scientists
						});
						res.end();
					});
				});
			});
		});
	});
}

const untrain = (connection) => (req, res) => {
	//formidable handles forms
	let form = formidable.IncomingForm();

	//parse form
	form.parse(req, (err, fields) => {
		if (err) throw err;

		//verify the credentials (NOTE: duplication)
		let query = 'SELECT accountId FROM sessions WHERE accountId = ? AND token = ?;';
		connection.query(query, [fields.id, fields.token], (err, results) => {
			if (err) throw err;

			if (results.length !== 1) {
				res.status(400).write('Invalid train credentials');
				res.end();
				return;
			}

			//verify the role argument
			if (fields.role !== 'soldier' && fields.role !== 'spy' && fields.role !== 'scientist') {
				res.status(400).write('Invalid untrain parameters');
				res.end();
				return;
			}

			//verify that the user has a high enough balance
			let query = 'SELECT soldiers, spies, scientists FROM profiles WHERE accountId = ?;';
			connection.query(query, [fields.id], (err, results) => {
				if (err) throw err;

				if (fields.role === 'soldier' && results[0].soldiers <= 0) {
					res.status(400).write('Not enough soldiers');
					res.end();
					return;
				}

				if (fields.role === 'spy' && results[0].spies <= 0) {
					res.status(400).write('Not enough spies');
					res.end();
					return;
				}

				if (fields.role === 'scientist' && results[0].scientists <= 0) {
					res.status(400).write('Not enough scientists');
					res.end();
					return;
				}

				//update the profile with new values
				let query = 'UPDATE profiles SET recruits = recruits + 1, soldiers = soldiers - ?, spies = spies - ?, scientists = scientists - ? WHERE accountId = ?;';
				connection.query(query, [fields.role === 'soldier' ? 1 : 0, fields.role === 'spy' ? 1 : 0, fields.role === 'scientist' ? 1 : 0, fields.id], (err) => {
					if (err) throw err;

					//send the new profile data as JSON (NOTE: possible duplication)
					let query = 'SELECT * FROM profiles WHERE accountId = ?;';
					connection.query(query, [fields.id], (err, results) => {
						if (err) throw err;

						//check just in case
						if (results.length !== 1) {
							res.status(400).write('Invalid recruit credentials');
							res.end();
							return;
						}

						//results.length === 1
						res.status(200).json({
							username: fields.username, //TODO: join here
							gold: results[0].gold,
							recruits: results[0].recruits,
							soldiers: results[0].soldiers,
							spies: results[0].spies,
							scientists: results[0].scientists
						});
						res.end();
					});
				});
			});
		});
	});
}

const runGoldTick = (connection) => {
	let goldTickJob = new CronJob('0 */30 * * * *', () => {
		let query = 'UPDATE profiles SET gold = gold + recruits;';
		connection.query(query, (err) => {
			if (err) throw err;

			//debugging
			//console.log(Date().toString() + ' gold tick');
		});
	});

	goldTickJob.start();
}

module.exports = {
//	profileCreate: profileCreate, //NOTE: Not actually used
	profileRequest: profileRequest,
	recruit: recruit,
	train: train,
	untrain: untrain,
	runGoldTick: runGoldTick
}