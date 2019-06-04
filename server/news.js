//environment variables
require('dotenv').config();

//libraries
let fs = require('fs');
let path = require('path');

let { log } = require('../common/utilities.js');

const newsRequest = () => (req, res) => {
	let fpath = path.join(__dirname, '..', 'public', 'news');
	let fileNames = fs.readdirSync(fpath);

	//if it's one specific post
	if (req.body.postId) {
		if (!fileNames.includes(req.body.postId)) {
			res.status(404).write('File Not Found');
			res.end();
			return;
		}

		let json = {};
		json[req.body.postId] = fs.readFileSync(path.join(fpath, req.body.postId), 'utf8');
		res.status(200).json(json);
		res.end();

		log('News sent (singular)', req.body.postId, JSON.stringify(json));
		return;
	}

	//set the maximum
	let max = parseInt(req.body.length) || 99;
	if (isNaN(max) || max > fileNames.length) {
		max = fileNames.length;
	}

	//build the object to send
	let json = {}; //TODO: caching

	//send each file as json
	for (let i = 0; i < max; i++) {
		json[fileNames[fileNames.length - i - 1]] = fs.readFileSync(path.join(fpath, fileNames[fileNames.length - i - 1]), 'utf8');
	}

	//actually send the data
	res.status(200).json(json);
	res.end();

	log('News sent', max, fileNames, JSON.stringify(json));
};

module.exports = {
	newsRequest: newsRequest
};