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

app.use(bodyParser.json());

//handle the news request
let news = require('./news.js');
app.get('/newsrequest', news.newsRequest());
app.post('/newsrequest', news.newsRequest());

//database
let { connectToDatabase } = require('./database.js');
let connection = connectToDatabase(); //uses .env

//handle diagnostics
let diagnostics = require('./diagnostics.js');
diagnostics.runDailyDiagnostics(connection);

//handle accounts
let accounts = require('./accounts.js');
app.post('/signuprequest', accounts.signupRequest(connection));
app.get('/verifyrequest', accounts.verifyRequest(connection));
app.post('/loginrequest', accounts.loginRequest(connection));
app.post('/logoutrequest', accounts.logoutRequest(connection));
app.post('/passwordchangerequest', accounts.passwordChangeRequest(connection));
app.post('/passwordrecoverrequest', accounts.passwordRecoverRequest(connection));
app.post('/passwordresetrequest', accounts.passwordResetRequest(connection));

//handle profiles
let profiles = require('./profiles.js');
app.post('/profilerequest', profiles.profileRequest(connection));
app.post('/recruitrequest', profiles.recruitRequest(connection));
app.post('/trainrequest', profiles.trainRequest(connection));
app.post('/untrainrequest', profiles.untrainRequest(connection));
app.post('/ladderrequest', profiles.ladderRequest(connection));
profiles.runGoldTick(connection);

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

//static directories
app.use('/content', express.static(path.resolve(__dirname + '/../public/content')) );
app.use('/img', express.static(path.resolve(__dirname + '/../public/img')) );
app.use('/styles', express.static(path.resolve(__dirname + '/../public/styles')) );

//the app file(s)
app.get('/*app.bundle.js', (req, res) => {
	res.sendFile(path.resolve(`${__dirname}/../public/${req.originalUrl.split('/').pop()}`));
});

//fallback
app.get('*', (req, res) => {
	res.sendFile(path.resolve(__dirname + '/../public/index.html'));
});

//startup
http.listen(4000, () => {
	log('listening to *:4000');
});