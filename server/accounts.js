//environment variables
require('dotenv').config();

//libraries
let bcrypt = require('bcrypt');
let formidable = require('formidable');
let sendmail = require('sendmail')({silent: true});

//utilities
let { log, validateEmail } = require('../common/utilities.js');
let { throttle, isThrottled } = require('../common/throttle.js');
let { logActivity } = require('./utilities.js');

const signupRequest = (connection) => (req, res) => {
	//formidable handles forms
	let form = formidable.IncomingForm();

	//parse form
	form.parse(req, (err, fields) => {
		if (err) throw err;

		//prevent too many clicks
		if (isThrottled(fields.email)) {
			res.status(400).write(log('Signup throttled', fields.email));
			res.end();
			return;
		}

		throttle(fields.email);

		//validate email, username and password
		if (!validateEmail(fields.email) || fields.username.length < 4 || fields.username.length > 100 || fields.password.length < 8 || fields.password !== fields.retype) {
			res.status(400).write(log('Invalid signup data', fields));
			res.end();
			return;
		}

		//check to see if the email has been banned
		let query = 'SELECT COUNT(*) as total FROM bannedEmails WHERE email = ?;';
		connection.query(query, [fields.email], (err, results) => {
			if (err) throw err;

			//if the email has been banned
			if (results[0].total > 0) {
				res.status(400).write(log('This email account has been banned!', 'signup', fields.email, fields.username));
				res.end();
				return;
			}

			//check if email, username already exists
			let query = 'SELECT (SELECT COUNT(*) FROM accounts WHERE email = ?) AS email, (SELECT COUNT(*) FROM accounts WHERE username = ?) AS username;';
			connection.query(query, [fields.email, fields.username], (err, results) => {
				if (err) throw err;

				if (results[0].email !== 0) {
					res.status(400).write(log('Email already registered!', fields.email));
					res.end();
					return;
				}

				if (results[0].username !== 0) {
					res.status(400).write(log('Username already registered!', fields.username));
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

							//TODO: make the verification email prettier
							//build the verification email
							let addr = `http://${process.env.WEB_ADDRESS}/verifyrequest?email=${fields.email}&verify=${rand}`;
							let msg = 'Hello! Please visit the following address to verify your account: ';
	//						let msgHtml = `<html><body><p>${msg}<a href='${addr}'>${addr}</a></p></body></html>`;

							//BUGFIX: is gmail being cruel?
							let sentinel = false;

							//send the verification email
							sendmail({
								from: `signup@${process.env.WEB_ADDRESS}`,
								to: fields.email,
								subject: 'Email Verification',
								text: msg + addr,
	//							html: msgHtml
							}, (err, reply) => {
								if (err) { //final check
									let msg = log('Something went wrong (did you use a valid email?)', err);

									if (!sentinel) {
										res.status(400).write(msg);
										res.end();
									}
								} else {
									let msg = log('Verification email sent!', fields.email, fields.username, rand);

									if (!sentinel) {
										res.status(200).json({ msg: msg });
										res.end();
									}
								}
								sentinel = true;
							});
						});
					});
				});
			});
		});
	});
};

const verifyRequest = (connection) => (req, res) => {
	//get the saved data
	let query = 'SELECT * FROM signups WHERE email = ?;';
	connection.query(query, [req.query.email], (err, results) => {
		if (err) throw err;

		//correct number of results
		if (results.length !== 1) {
			res.status(400).write(log('That account does not exist or this link has already been used.', req.query.email, req.query.verify));
			res.end();
			return;
		}

		//verify the link
		if (req.query.verify != results[0].verify) {
			res.status(400).write(log('Verification failed!', req.query.email, req.query.verify, results[0].verify));
			res.end();
			return;
		}

		//BUGFIX: a delay to prevent the fail message appearing to the end user
		setTimeout(() => {
			log('Trying to create account', req.query.email);

			//move the data from signups to accounts
			let query = 'INSERT IGNORE INTO accounts (email, username, salt, hash) VALUES (?, ?, ?, ?);';
			connection.query(query, [results[0].email, results[0].username, results[0].salt, results[0].hash], (err) => {
				if (err) throw err;

				//delete from signups
				let query = 'DELETE FROM signups WHERE email = ?;';
				connection.query(query, [results[0].email], (err) => {
					if (err) throw err;

					log('Account created', req.query.email);
				});
			});
		}, 3000); //3 second delay on account creation

		//TODO: prettier verification page
		res.status(200).write(log('<p>Verification succeeded!</p><p><a href="/">Return Home</a></p>', req.query.email));
		res.end();
	});
};

const loginRequest = (connection) => (req, res) => {
	//formidable handles forms
	let form = formidable.IncomingForm();

	//parse form
	form.parse(req, (err, fields) => {
		if (err) throw err;

		//validate email, username and password
		if (!validateEmail(fields.email) || fields.password.length < 8) {
			res.status(400).write(log('Invalid login data', fields.email)); //WARNING: NEVER LOG PASSWORDS. EVER.
			res.end();
			return;
		}

		//check to see if the email has been banned
		let query = 'SELECT COUNT(*) as total FROM bannedEmails WHERE email = ?;';
		connection.query(query, [fields.email], (err, results) => {
			if (err) throw err;

			//if the email has been banned
			if (results[0].total > 0) {
				res.status(400).write(log('This email account has been banned!', 'login', fields.email));
				res.end();
				return;
			}

			//find this email's information
			let query = 'SELECT id, username, salt, hash FROM accounts WHERE email = ?;';
			connection.query(query, [fields.email], (err, results) => {
				if (err) throw err;

				//found this email?
				if (results.length === 0) {
					res.status(400).write(log('Incorrect email or password', fields.email, 'Did not find this email')); //NOTE: deliberately obscure incorrect email or password
					res.end();
					return;
				}

				//gen a new hash from the salt and password
				bcrypt.hash(fields.password, results[0].salt, (err, newHash) => {
					if (err) throw err;

					//compare the passwords
					if (results[0].hash !== newHash) {
						res.status(400).write(log('Incorrect email or password', fields.email, 'Did not find this password'));
						res.end();
						return;
					}

					//create the new session
					let rand = Math.floor(Math.random() * Number.MAX_SAFE_INTEGER);

					let query = 'INSERT INTO sessions (accountId, token) VALUES (?, ?);';
					connection.query(query, [results[0].id, rand], (err) => {
						if (err) throw err;

						//send json containing the account info
						res.status(200).json({
							id: results[0].id,
							email: fields.email,
							username: results[0].username,
							token: rand,
							msg: log('Logged in', fields.email, rand)
						});
						res.end();

						logActivity(connection, results[0].id);
					});
				});
			});
		});
	});
};

const logoutRequest = (connection) => (req, res) => {
	let query = 'DELETE FROM sessions WHERE sessions.accountId = ? AND token = ?;'; //NOTE: The user now loses this access token
	connection.query(query, [req.body.id, req.body.token], (err) => {
		if (err) throw err;
		log('Logged out', req.body.id, req.body.token);
		logActivity(connection, req.body.id);
	});

	res.end(); //NOTE: don't send a response
};

const passwordChangeRequest = (connection) => (req, res) => {
	//formidable handles forms
	let form = formidable.IncomingForm();

	//parse form
	form.parse(req, (err, fields) => {
		if (err) throw err;

		//validate password, retype
		if (fields.password.length < 8 || fields.password !== fields.retype) {
			res.status(400).write(log('Invalid password change data', fields.id));
			res.end();
			return;
		}

		//validate token
		query = 'SELECT COUNT(*) AS total FROM sessions WHERE sessions.accountId = ? AND sessions.token = ?;';
		connection.query(query, [fields.id, fields.token], (err, results) => {
			if (err) throw err;

			if (results[0].total !== 1) {
				res.status(400).write(log('Invalid password change credentials', fields.id, fields.token));
				res.end();
				return;
			}

			//generate the new salt, hash
			bcrypt.genSalt(11, (err, salt) => {
				if (err) throw err;
				bcrypt.hash(fields.password, salt, (err, hash) => {
					if (err) throw err;

					let query = 'UPDATE accounts SET salt = ?, hash = ? WHERE id = ?;';
					connection.query(query, [salt, hash, fields.id], (err) => {
						if (err) throw err;

						//clear all session data for this user (a 'feature')
						let query = 'DELETE FROM sessions WHERE sessions.accountId = ?;';
						connection.query(query, [fields.id], (err) => {
							if (err) throw err;

							//create the new session
							let rand = Math.floor(Math.random() * 100000);

							let query = 'INSERT INTO sessions (accountId, token) VALUES (?, ?);';
							connection.query(query, [fields.id, rand], (err) => {
								if (err) throw err;

								//send json containing the account info
								res.status(200).json({
									token: rand,
									msg: log('Password changed!', fields.id)
								});
								res.end();

								logActivity(connection, fields.id);
							});
						});
					});
				});
			});
		});
	});
};

const passwordRecoverRequest = (connection) => (req, res) => {
	//formidable handles forms
	let form = formidable.IncomingForm();

	//parse form
	form.parse(req, (err, fields) => {
		if (err) throw err;

		//prevent too many clicks
		if (isThrottled(fields.email)) {
			res.status(400).write(log('Recover throttled', fields.email));
			res.end();
			return;
		}

		throttle(fields.email);

		//validate email
		if (!validateEmail(fields.email)) {
			res.status(400).write(log('Invalid recover data', fields.email));
			res.end();
			return;
		}

		//ensure that this email is registered to an account
		let query = 'SELECT accounts.id FROM accounts WHERE email = ?;';
		connection.query(query, [fields.email], (err, results) => {
			if (err) throw err;

			if (results.length !== 1) {
				res.status(400).write(log('Invalid recover data (did you use a registered email?)', fields.email));
				res.end();
				return;
			}

			//create the new recover record
			let rand = Math.floor(Math.random() * 100000);

			let query = 'REPLACE INTO passwordRecover (accountId, token) VALUES (?, ?)';
			connection.query(query, [results[0].id, rand], (err) => {
				if (err) throw err;

				//TODO: prettier recovery email
				//build the recovery email
				let addr = `http://${process.env.WEB_ADDRESS}/passwordreset?email=${fields.email}&token=${rand}`;
				let msg = 'Hello! Please visit the following address to set a new password (if you didn\'t request a password recovery, ignore this email): ';
//				let msgHtml = `<html><body><p>${msg}<a href='${addr}'>${addr}</a></p></body></html>`;

				//BUGFIX: is gmail being cruel?
				let sentinel = false;

				//send the verification email
				sendmail({
					from: `passwordrecover@${process.env.WEB_ADDRESS}`,
					to: fields.email,
					subject: 'Password Recovery',
					text: msg + addr,
//					html: msgHtml
				}, (err, reply) => {
					//final check
					if (err) {
						if (!sentinel) {
							let msg = log('Something went wrong (did you use a valid email?)', err);

							res.status(400).write(msg);
							res.end();
						}
					} else {
						let msg = log('Recovery email sent!', fields.email);

						res.status(200).json({ msg: msg });
						res.end();
					}

					sentinel = true;
				});
			});
		});
	});
};

const passwordResetRequest = (connection) => (req, res) => {
	//formidable handles forms
	let form = formidable.IncomingForm();

	//parse form
	form.parse(req, (err, fields) => {
		if (err) throw err;

		//validate email and password
		if (!validateEmail(fields.email) || fields.password.length < 8 || fields.password !== fields.retype) {
			res.status(400).write(log('Invalid reset data (invalid email/password)', fields.email));
			res.end();
			return;
		}

		//get the account based on this email, token
		let query = 'SELECT * FROM accounts WHERE email = ? AND id IN (SELECT passwordRecover.accountId FROM passwordRecover WHERE token = ?);';
		connection.query(query, [fields.email, fields.token], (err, results) => {
			if (err) throw err;

			//results should be only 1 account
			if (results.length !== 1) {
				res.status(400).write(log('Invalid reset data (incorrect parameters/database state)', fields.email));
				res.end();
				return;
			}

			//generate the new salt, hash
			bcrypt.genSalt(11, (err, salt) => {
				if (err) throw err;
				bcrypt.hash(fields.password, salt, (err, hash) => {
					if (err) throw err;

					//update the salt, hash
					let query = 'UPDATE accounts SET salt = ?, hash = ? WHERE email = ?;';
					connection.query(query, [salt, hash, fields.email], (err) => {
						if (err) throw err;

						//delete the recover request from the database
						let query = 'DELETE FROM passwordRecover WHERE accountId IN (SELECT id FROM accounts WHERE email = ?);';
						connection.query(query, [fields.email], (err) => {
							if (err) throw err;

							res.status(200).json({ msg: log('Password updated!', fields.email) });
							res.end();

							logActivity(connection, results[0].id);
						});
					});
				});
			});
		});
	});
};

module.exports = {
	signupRequest: signupRequest,
	verifyRequest: verifyRequest,
	loginRequest: loginRequest,
	logoutRequest: logoutRequest,
	passwordChangeRequest: passwordChangeRequest,
	passwordRecoverRequest: passwordRecoverRequest,
	passwordResetRequest: passwordResetRequest
};