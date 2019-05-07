//libraries
let express = require('express');
let app = express();
let http = require('http').Server(app);
let path = require('path');

//handle accounts
app.post('/signup', (req, res) => {
	console.log('message heard, data ignored')
	res.write('<p>message heard, data ignored</p>');
	res.end();
});

//static directories
app.use('/styles', express.static(path.resolve(__dirname + '/../public/styles')) );

//the app file
app.get('/app.bundle.js', (req, res) => {
  res.sendFile(path.resolve(__dirname + '/../public/app.bundle.js'));
});

//fallback
app.get('*', (req, res) => {
  res.sendFile(path.resolve(__dirname + '/../public/index.html'));
});

//startup
http.listen(4000, () => {
  console.log('listening to *:4000');
});