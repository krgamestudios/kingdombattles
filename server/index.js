//environment variables
require('dotenv').config();

//libraries
let express = require('express');
let app = express();
let http = require('http').Server(app);
let bodyParser = require('body-parser');
let path = require('path');

//utilities
let { log } = require('../common/utilities.js');
let { replacement, stringReplacement } = require('../common/replacement.js');

app.use(bodyParser.json());

//handle the news request
let news = require('./news.js');
app.get('/newsrequest', news.newsRequest());
app.post('/newsrequest', news.newsRequest());
app.get('/newsheadersrequest', news.newsHeadersRequest());
app.post('/newsheadersrequest', news.newsHeadersRequest());

//database
let { connectToDatabase } = require('./database.js');
let connection = connectToDatabase(); //uses .env

//handle diagnostics
let diagnostics = require('./diagnostics.js');
diagnostics.runDailyDiagnostics(connection);

//game statistics
let statistics = require('./statistics.js');
app.post('/statisticsrequest', statistics.statisticsRequest(connection));

//handle accounts
let accounts = require('./accounts.js');
app.post('/signuprequest', accounts.signupRequest(connection));
app.get('/verifyrequest', accounts.verifyRequest(connection));
app.post('/loginrequest', accounts.loginRequest(connection));
app.post('/logoutrequest', accounts.logoutRequest(connection));
app.post('/passwordchangerequest', accounts.passwordChangeRequest(connection));
app.post('/passwordrecoverrequest', accounts.passwordRecoverRequest(connection));
app.post('/passwordresetrequest', accounts.passwordResetRequest(connection));
app.post('/privacysettingsrequest', accounts.privacySettingsRequest(connection));
app.post('/privacysettingsupdaterequest', accounts.privacySettingsUpdateRequest(connection));

//handle profiles
let profiles = require('./profiles.js');
app.post('/profilerequest', profiles.profileRequest(connection));
app.post('/recruitrequest', profiles.recruitRequest(connection));
app.post('/trainrequest', profiles.trainRequest(connection));
app.post('/untrainrequest', profiles.untrainRequest(connection));
app.post('/ladderrequest', profiles.ladderRequest(connection));
profiles.runGoldTick(connection);
profiles.runLadderTick(connection);

let combat = require('./combat.js');
app.post('/attackrequest', combat.attackRequest(connection));
app.post('/attackstatusrequest', combat.attackStatusRequest(connection));
app.post('/combatlogrequest', combat.combatLogRequest(connection));
combat.runCombatTick(connection);

let spying = require('./spying.js');
app.post('/spyrequest', spying.spyRequest(connection));
app.post('/spystatusrequest', spying.spyStatusRequest(connection));
app.post('/spylogrequest', spying.spyLogRequest(connection));
spying.runSpyTick(connection);

let equipment = require('./equipment.js');
app.post('/equipmentrequest', equipment.equipmentRequest(connection));
app.post('/equipmentpurchaserequest', equipment.purchaseRequest(connection));
app.post('/equipmentsellrequest', equipment.sellRequest(connection));

let badges = require('./badges.js');
app.post('/badgeslistrequest', badges.listRequest(connection));
app.post('/badgesownedrequest', badges.ownedRequest(connection));
app.post('/badgeselectactiverequest', badges.selectActiveBadge(connection));
badges.runBadgeTicks(connection);

//a bit of fun
const taglineEngine = replacement(require('./taglines.json'));
app.get('/taglinerequest', (req, res) => {
	res.send(taglineEngine('tagline'));
});

app.post('/easteregg', (req, res) => {
	if (req.body.query === 'search') {
		res.status(200).send('You found it!');
	} else {
		res.status(404).send('Keep searching!');
	}
});

//static directories
app.use('/content', express.static(path.resolve(__dirname + '/../public/content')) );
app.use('/img', express.static(path.resolve(__dirname + '/../public/img')) );
app.use('/styles', express.static(path.resolve(__dirname + '/../public/styles')) );

//ads
app.get('/ads.txt', (req, res) => {
	res.sendFile(path.resolve(__dirname + `/../public/${req.originalUrl}`));
});

//the app file(s)
app.get('/*app.bundle.js', (req, res) => {
	res.sendFile(path.resolve(`${__dirname}/../public/${req.originalUrl.split('/').pop()}`));
});

//source map (for development)
app.get('/app.bundle.js.map', (req, res) => {
	res.sendFile(path.resolve(__dirname + `/../public/${req.originalUrl}`));
});

//fallback to index.html
app.get('*', (req, res) => {
	res.sendFile(path.resolve(__dirname + '/../public/index.html'));
});

//startup
http.listen(3000, () => {
	log('listening to *:3000');
});
