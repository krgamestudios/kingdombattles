let emailExpression = /^(([^<>()[\]\\.,;:\s@\"]+(\.[^<>()[\]\\.,;:\s@\"]+)*)|(\".+\"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/;

function validateEmail(email) {
	return emailExpression.test(email);
}

let excluded = [ //messages that should not be logged
	'Not enough gold',
	'Not enough recruits',
	'Not enough soldiers',
	'Not enough spies',
	'Not enough scientists',
	'Not enough time has passed',

	'Profile sent',
	'Ladder sent',
	'attacking',
	'idle',

	'Combat log sent',
	'Spy log sent',
	'News sent',
	'News sent (singular)',

	'Can\'t train while attacking',
	'Can\'t untrain while attacking',
	'Can\'t train while spying',
	'Can\'t untrain while spying',
	'Can\'t purchase while attacking',
	'Can\'t sell while attacking',
	'Can\'t purchase while spying',
	'Can\'t sell while spying',

	'Purchase made',
	'Sale made',

	'Cleaned database'
];

const log = (msg, ...args) => {
	if (excluded.indexOf(msg) === -1) {
		let dateString = Date().replace(/\s\(.*\)/i, ''); //dumb formatting
		console.log(`log ${dateString}: ${msg} (${args.toString()})`);
	}
	return msg;
}

module.exports = {
	validateEmail: validateEmail,
	log: log
};