//environment variables
require('dotenv').config();

//utilities
let { log } = require('../common/utilities.js');

const attackRequest = (connection) => (req, res) => {
	res.status(400).write(log('Not yet implemented'));
	res.end();
}

module.exports = {
	attackRequest: attackRequest
}