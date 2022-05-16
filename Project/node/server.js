const express = require('express');
const path = require('path');
const axios = require('axios'); // utile per semplificare le chiamate alle api - rispetto al normale 'http', dato che 'fetch' non è ancora supportato in nodejs
const bodyParser = require('body-parser');  // necessario per leggere il contenuto del 'body' di una richiesta in POST

// Configure dotenv package
require("dotenv").config();

const app = express();
const port = process.env.PORT || 8080;


//Express static file module
app.use(express.static(__dirname + '/assets'));

app.use(bodyParser.urlencoded({ extended: false }));
app.use(bodyParser.json());

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

app.post('/weatherData', async function (req, res) {
    //console.log(req.body);
    await axios.get('https://api.openweathermap.org/data/2.5/onecall?lat=' + req.body.lat + '&lon=' + req.body.lon + '&exclude=' + req.body.exclude + '&units=metric&lang=it&appid=' + process.env.API_KEY)
        .then(response => {
            //console.log('invio risposta api weatherData');
            res.send(response.data);
        })
        .catch(error => {
            console.log(error);
        });
});

app.post('/oldData', async function (req, res) {
    //console.log(req.body);
    await axios.get('https://api.openweathermap.org/data/2.5/onecall/timemachine?lat=' + req.body.lat + '&lon=' + req.body.lon + '&dt=' + req.body.dt + '&units=metric&lang=it&appid=' + process.env.API_KEY)
        .then(response => {
            //console.log('invio risposta api oldData');
            res.send(response.data);
        })
        .catch(error => {
            console.log(error);
        });
});

app.listen(port);
console.log('Server started at http://localhost:' + port);