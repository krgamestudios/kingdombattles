//environment variables
require('dotenv').config();

//libraries
let bcrypt = require('bcrypt');
let formidable = require('formidable');
let sendmail = require('sendmail')();

//utilities
let { validateEmail } = require('../common/utilities.js');

function signup(connection) {
	return (req, res) => {
		//formidable handles forms
		let form = formidable.IncomingForm();

		//parse form
		form.parse(req, (err, fields) => {
			if (err) throw err;

			//validate email, username and password
			if (!validateEmail(fields.email) || fields.username.length < 4 || fields.username.length > 100 || fields.password.length < 8 || fields.password !== fields.retype) {
				res.write('<p>Invalid signup data</p>');
				res.end();
				return;
			}

			//check if email, username already exists
			let query = 'SELECT (SELECT COUNT(*) FROM accounts WHERE email = ?) AS email, (SELECT COUNT(*) FROM accounts WHERE username = ?) AS username;';
			connection.query(query, [fields.email, fields.username], (err, results) => {
				if (err) throw err;

				if (results[0].email !== 0) {
					res.write('<p>Email already registered!</p>');
					res.end();
					return;
				}

				if (results[0].username !== 0) {
					res.write('<p>Username already registered!</p>');
					res.end();
					return;
				}

				//generate the salt, hash
				bcrypt.genSalt(11, (err, salt) => {
					if (err) throw err;
					bcrypt.hash(fields.password, salt, (err, hash) => {
						if (err) throw err;

						//generate a random number as a token
						let rand = Math.floor(Math.random() * 100000);

						//save the generated data to the signups table
						let query = 'REPLACE INTO signups (email, username, salt, hash, verify) VALUES (?, ?, ?, ?, ?);';
						connection.query(query, [fields.email, fields.username, salt, hash, rand], (err) => {
							if (err) throw err;

							//build the verification email
							let addr = `http://${process.env.WEB_ADDRESS}/verify?email=${fields.email}&verify=${rand}`;
							let msg = 'Hello! Please visit the following address to verify your account: ';
							let msgHtml = `<html><body><p>${msg}<a href='${addr}'>${addr}</a></p></body></html>`;

							//send the verification email
							sendmail({
								from: `signup@${process.env.WEB_ADDRESS}`,
								to: fields.email,
								subject: 'Email Verification',
								text: msg + addr,
								html: msgHtml
							}, (err, reply) => {
								//final check
								if (err) {
									res.write(`<p>Something went wrong (did you use a valid email?)</p>${err}`)
									res.end();
									return;
								}

								res.write('<p>Verification email sent!</p>');
								res.end();
							});
						})
					});
				});
			});
		});
	}
}

function verify(connection) {
	return (req, res) => {
		//get the saved data
		let query = 'SELECT email, username, salt, hash, verify FROM signups WHERE email = ?;';

		connection.query(query, [req.query.email], (err, results) => {
			if (err) throw err;

			//correct number of results
			if (results.length != 1) {
				res.write('<p>That account does not exist or this link has already been used.</p>');
				res.end();
				return;
			}

			//verify the link
			if (req.query.verify != results[0].verify) {
				res.write('<p>Verification failed!</p>');
				res.end();
				return;
			}

			//move the data from signups to accounts
			let query = 'INSERT INTO accounts (email, username, salt, hash) VALUES (?, ?, ?, ?);';
			connection.query(query, [results[0].email, results[0].username, results[0].salt, results[0].hash], (err) => {
				if (err) throw err;

				//delete from signups
				let query = 'DELETE FROM signups WHERE email = ?;';
				connection.query(query, [results[0].email], (err) => {
					if (err) throw err;

					res.write('<p>Verification succeeded!</p>');
					res.end();
				});
			});
		});
	}
}

function login(connection) {
	return (req, res) => {
		//formidable handles forms
		let form = formidable.IncomingForm();

		//parse form
		form.parse(req, (err, fields) => {
			if (err) throw err;

			//validate email, username and password
			if (!validateEmail(fields.email) || fields.password.length < 8) {
				res.write('<p>Invalid login data</p>');
				res.end();
				return;
			}

			//find this email's information
			let query = 'SELECT id, username, salt, hash FROM accounts WHERE email = ?;';
			connection.query(query, [fields.email], (err, results) => {
				if (err) throw err;

				//found this email?
				if (results.length === 0) {
					res.status(400).write('Incorrect email or password');
					res.end();
					return;
				}

				//gen a new hash from the salt and password
				bcrypt.hash(fields.password, results[0].salt, (err, newHash) => {
					if (err) throw err;

					//compare the passwords
					if (results[0].hash !== newHash) {
						res.status(400).write('Incorrect email or password');
						res.end();
						return;
					}

					//create the new session
					let rand = Math.floor(Math.random() * 100000);

					let query = 'INSERT INTO sessions (accountId, token) VALUES (?, ?);';
					connection.query(query, [results[0].id, rand], (err) => {
						if (err) throw err;

						//send json containing the account info
						res.status(200).json({
							id: results[0].id,
							email: fields.email,
							username: results[0].username,
							token: rand
						});
					});
				});
			});
		});
	}
}

function logout(connection) {
	return (req, res) => {
		let query = 'DELETE FROM sessions WHERE sessions.accountId IN (SELECT accounts.id FROM accounts WHERE email = ?) AND token = ?;';
		connection.query(query, [req.body.email, req.body.token], (err) => {
			if (err) throw err;
		});

		res.end();
	}
}

function passwordChange(connection) {
	return (req, res) => {
		//formidable handles forms
		let form = formidable.IncomingForm();

		//parse form
		form.parse(req, (err, fields) => {
			if (err) throw err;

			//validate password, retype
			if (!validateEmail(fields.email) || fields.password.length < 8 || fields.password !== fields.retype) {
				res.write('<p>Invalid password change data</p>');
				res.end();
				return;
			}

			//generate the new salt, hash
			bcrypt.genSalt(11, (err, salt) => {
				if (err) throw err;
				bcrypt.hash(fields.password, salt, (err, hash) => {
					if (err) throw err;

					let query = 'UPDATE accounts SET salt = ?, hash = ? WHERE email = ?;';
					connection.query(query, [salt, hash, fields.email], (err) => {
						if (err) throw err;

						//clear all session data for this user (a 'feature')
						let query = 'DELETE FROM sessions WHERE sessions.accountId IN (SELECT accounts.id FROM accounts WHERE email = ?);';
						connection.query(query, [fields.email], (err) => {
							if (err) throw err;

							//create the new session
							let rand = Math.floor(Math.random() * 100000);

							let query = 'INSERT INTO sessions (accountId, token) VALUES ((SELECT accounts.id FROM accounts WHERE email = ?), ?);';
							connection.query(query, [fields.email, rand], (err) => {
								if (err) throw err;

								//send json containing the account info
								res.status(200).json({
									token: rand
								});
							});
						});
					});
				});
			});
		});
	}
}

module.exports = {
	signup: signup,
	verify: verify,
	login: login,
	logout: logout,
	passwordChange: passwordChange
};