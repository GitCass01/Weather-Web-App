const express = require('express');
const path = require('path');

// Configure dotenv package
require("dotenv").config();

const app = express();
const port = process.env.PORT || 8080;


//Express static file module
app.use(express.static(__dirname + '/assets'));

// index.html
app.get('/', function (req, res) {
    res.sendFile(path.join(__dirname, '/views/index.html'));
});

app.get('/index', function (req, res) {
    res.sendFile(path.join(__dirname, '/views/index.html'));
});

app.get('/index.html', function (req, res) {
    res.sendFile(path.join(__dirname, '/views/index.html'));
});

// weather.html
app.get('/weather.html', function (req, res) {
    res.sendFile(path.join(__dirname, '/views/weather.html'));
});

app.listen(port);
console.log('Server started at http://localhost:' + port);