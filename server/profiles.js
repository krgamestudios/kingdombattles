//environment variables
require('dotenv').config();

//libraries
let formidable = require('formidable');

function profileRequest(connection) {
	return (req, res) => {
		//formidable handles forms
		let form = formidable.IncomingForm();

		//parse form
		form.parse(req, (err, fields) => {
			if (err) throw err;

			//TODO: do something with the id and token provided

			let query = 'SELECT * FROM profiles WHERE accountId IN (SELECT accounts.id FROM accounts WHERE username = ?);';
			connection.query(query, [fields.username], (err, results) => {
				if (err) throw err;

				if (results.length !== 1) {
					res.status(400).write(`Failed to find that profile: ${fields.username}`);
					res.end();
					return;
				}

				res.status(200).json({
					username: fields.username,
					gold: results[0].gold,
					recruits: results[0].recruits,
					soldiers: results[0].soldiers,
					spies: results[0].spies,
					scientists: results[0].scientists
				});
				res.end();
			});
		});
	};
}

module.exports = {
	profileRequest: profileRequest
}