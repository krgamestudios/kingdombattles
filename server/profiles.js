//environment variables
require('dotenv').config();

//libraries
let formidable = require('formidable');

function profileCreate(connection) {
	return (req, res) => {
		//formidable handles forms
		let form = formidable.IncomingForm();

		//parse form
		form.parse(req, (err, fields) => {
			if (err) throw err;

			//separate this section so it can be used elsewhere too
			return profileCreateInner(connection, req, res, fields);
		});
	};
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

function profileRequest(connection) {
	return (req, res) => {
		//formidable handles forms
		let form = formidable.IncomingForm();

		//parse form
		form.parse(req, (err, fields) => {
			if (err) throw err;

			//separate this section so it can be used elsewhere too
			return profileRequestInner(connection, req, res, fields);
		});
	};
}

function profileRequestInner(connection, req, res, fields) {
	//TODO: do something with the id and token provided

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
					res.status(404).write('Profile not found');
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

module.exports = {
//	profileCreate: profileCreate, //NOTE: Not actually used
	profileRequest: profileRequest
}