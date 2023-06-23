const express = require('express');
const app = express();
const port = 8000
const hostname = '0.0.0.0'

// router
const router = require('./router');

app.use(express.json());
app.use(express.urlencoded({ extended: false }));

// Set view dir
app.set('views', __dirname + '/views');

// Set view engine
app.set('view engine', 'ejs');
app.engine('html', require('ejs').renderFile);

// Set router
app.use('/', router);

// Set static dir
app.use(express.static(__dirname + '/public'));

app.listen(port,hostname, function () {
  console.log(`Example app listening on port ${port}!`);
});