const express = require('express');
const path = require('path');
// api call
const axios = require('axios'); // utile per semplificare le chiamate alle api - rispetto al normale 'http', dato che 'fetch' non è ancora supportato in nodejs
const bodyParser = require('body-parser');  // necessario per leggere il contenuto del 'body' di una richiesta in POST
// database json
const JsonDB = require("node-json-db").JsonDB;
const Config = require("node-json-db/dist/lib/JsonDBConfig").Config;
// worker thread
const { Worker, workerData } = require('worker_threads');
// loggers
const morgan = require("./utils/morganMiddleware");
const logger = require("./utils/logger");
// mail
const nodemailer = require('nodemailer');

// Configure dotenv package
require("dotenv").config();

const app = express();
const port = process.env.PORT || 8080;

// weatherDataWorker thread
const weatherDataWorker = new Worker(__dirname + '/utils/weatherDataWorker.js', { workerData: 'Prova' });
weatherDataWorker.on("message", result => {
    logger.info(result.status);
});
weatherDataWorker.on("error", error => {
    logger.error(error);
});
weatherDataWorker.on("exit", exitCode => {
    logger.warn(exitCode);
})

/* Databases
    weatherData: {
        city: {
            dt:
            data: {
                
            }
        }
    }

    chartTemperatures: {
        city: {
            dt: 
            data: {
                dates:
                temp_max:
                temp_min
            }
        }
    }

    chartRains: {
        city: {
            dt:
            data: {
                dates:
                rain_total_mm:
            }
        }
    }
*/
const weatherData = new JsonDB(new Config(__dirname + '/assets/databases/weatherData', true, false, '/'));
var chartTemperatures = new JsonDB(new Config(__dirname + '/assets/databases/chartTemperatures', true, false, '/'));
var chartRains = new JsonDB(new Config(__dirname + '/assets/databases/chartRains', true, false, '/'));

//Express static file module
app.use(express.static(__dirname + '/assets'));

app.use(bodyParser.urlencoded({ extended: false }));
app.use(bodyParser.json());
app.use(morgan);

// index.html
app.get('/', function (req, res) {
    res.setHeader('Content-Type', 'text/html');
    res.sendFile(path.join(__dirname, '/views/index.html'));
});

app.get('/index', function (req, res) {
    res.setHeader('Content-Type', 'text/html');
    res.sendFile(path.join(__dirname, '/views/index.html'));
});

app.get('/index.html', function (req, res) {
    res.setHeader('Content-Type', 'text/html');
    res.sendFile(path.join(__dirname, '/views/index.html'));
});

// weather.html
app.get('/weather.html', function (req, res) {
    res.setHeader('Content-Type', 'text/html');
    res.sendFile(path.join(__dirname, '/views/weather.html'));
});

app.get('/geo', async function (req, res) {
    await axios.get('https://api.openweathermap.org/geo/1.0/direct?q=' + req.query.city + '&limit=5&appid=' + process.env.API_KEY)
        .then(response => {
            res.send(response.data);
        })
        .catch(error => {
            logger.error(error);
        });
});

app.get('/weatherData', async function (req, res) {
    //console.log('invio risposta api weatherData');
    //console.log(req.query);
    let data;
    let check = false;
    try {
        // il metodo getData() ritorna un errore se non esiste la entry nel deb
        data = weatherData.getData('/' + req.query.city + '/data');
    } catch (error) {
        check = true;
        await axios.get('https://api.openweathermap.org/data/2.5/onecall?lat=' + req.query.lat + '&lon=' + req.query.lon + '&exclude=minutely&units=metric&lang=it&appid=' + process.env.API_KEY)
            .then(response => {
                data = response.data;
            })
            .catch(error => {
                logger.error(error);
            });
    }
    res.send(data);
    if (check) {
        logger.warn('Creo weatherData per ' + req.query.city);
        weatherData.push('/' + req.query.city, {
            dt: new Date().getTime(),
            data: data
        });
    }
});

app.get('/chartTemperatures', async function (req, res) {
    try {
        chartTemperatures.getData('/' + req.query.city);
    } catch (error) {
        logger.warn('Creo chartTemperatures e chartRains per: ' + req.query.city);
        await getChartData(req.query);
    }
    res.send(chartTemperatures.getData('/' + req.query.city + '/data'));
});

app.get('/chartRains', async function (req, res) {
    res.send(chartRains.getData('/' + req.query.city + '/data'));
});

app.get('/getPrecipitationTiles', async function (req, res) {
    const tileURL = 'https://tile.openweathermap.org/map/precipitation_new/' + req.query.z + '/' + req.query.x + '/' + req.query.y + '.png?appid=' + process.env.API_KEY;

    res.setHeader('Content-Type', 'text/plain');
    res.send(tileURL);
});

app.get('/getTempTiles', async function (req, res) {
    const tileURL = 'https://tile.openweathermap.org/map/temp_new/' + req.query.z + '/' + req.query.x + '/' + req.query.y + '.png?appid=' + process.env.API_KEY;

    res.setHeader('Content-Type', 'text/plain');
    res.send(tileURL);
});

app.post('/contactMe', function (req, res) {
    const transporter = nodemailer.createTransport({
        service: 'gmail',
        auth: {
            user: process.env.mail,
            pass: process.env.pass
        }
        // necessario abilitare 'support for 'less secure' apps' per il servizio gmail --> non più disponibile dal 30 maggio...
        /*tls: {
            rejectUnauthorized: false // oppure controllare antivirus causa problema
        }*/
    });

    const mailOptions = {
        from: req.body.email,
        to: process.env.mail,
        subject: 'Messaggio da: ' + req.body.email,
        text: req.body.message
    };

    transporter.sendMail(mailOptions, function (error, info) {
        if (error) {
            logger.error(error);
            res.send({ code: 'Error' });
        } else {
            logger.info('Email inviata: ' + info.response);
            res.send({ code: 'Success' });
        }
    });
});

app.listen(port);
logger.info('Server started at http://localhost:' + port);

/* FUNZIONI */

/* chart data */
async function getOldData(query) {
    const today = new Date();
    const arrOldData = [];
    for (let i = 5; i >= 1; i--) {
        let pastDate = Math.round(new Date().setDate(today.getDate() - i) / 1000); // voglio la data in secondi per openweathermap

        await axios.get('https://api.openweathermap.org/data/2.5/onecall/timemachine?lat=' + query.lat + '&lon=' + query.lon + '&dt=' + pastDate + '&units=metric&lang=it&appid=' + process.env.API_KEY)
            .then(response => {
                arrOldData.push(response.data);
            })
            .catch(error => {
                logger.error(error);
            });
    }

    return arrOldData;
};

async function getChartData(query) {
    const dates = [];
    const temp_max = [];
    const temp_min = [];
    const rain_total_mm = [];

    const arrOldData = await getOldData(query);
    arrOldData.forEach(daysBefore => {
        dates.push('' + timestampToDate(daysBefore.current.dt, daysBefore.timezone_offset).toLocaleDateString());

        // l'api non fornisce la temp max e min relative ai giorni precedenti (historical)
        // quindi itero sulle ore del giorno e ricavo le temp max e min
        // e
        // l'api non fornisce l'umidità max e min relative ai giorni precedenti (historical)
        // quindi itero sulle ore del giorno e ricavo l'umidità max e min
        let mm = 0;
        let max = daysBefore.current.temp;
        let min = daysBefore.current.temp;
        for (let i = 0; i < 24; i++) {
            let tmp = daysBefore.hourly[i].temp;
            if (tmp < min) {
                min = tmp;
            }
            if (tmp > max) {
                max = tmp;
            }

            for (let i = 0; i < 24; i++) {
                if (daysBefore.hourly[i].rain) {
                    mm += daysBefore.hourly[i].rain["1h"];
                }
            }
        }

        temp_max.push(Math.round(max));
        temp_min.push(Math.round(min));
        rain_total_mm.push(mm);
    });

    const daily = weatherData.getData('/' + query.city + '/data/daily');
    const timezone_offset = weatherData.getData('/' + query.city + '/data/timezone_offset');
    for (let i = 0; i < 8; i++) {
        dates.push('' + timestampToDate(daily[i].dt, timezone_offset).toLocaleDateString());
        temp_max.push(Math.round(daily[i].temp.max));
        temp_min.push(Math.round(daily[i].temp.min));

        let mm = 0;
        if (daily[i].rain) {
            mm = daily[i].rain;
        }
        rain_total_mm.push(mm);
    }

    const dataTemp = { dates, temp_max, temp_min };
    const dataRain = { dates, rain_total_mm };

    // salvo i dati nel db 'chartTemperatures'
    chartTemperatures.push('/' + query.city, {
        dt: new Date().getTime(),
        data: dataTemp
    });

    // salvo i dati nel db 'chartRains'
    chartRains.push('/' + query.city, {
        dt: new Date().getTime(),
        data: dataRain
    });
}

// conversione da timestamp Unix, UTC in data
function timestampToDate(timestamp, offset) {
    const tz = new Date('August 19, 1975 23:15:30').getTimezoneOffset() * 60;
    // multiplied by 1000 so that the argument is in milliseconds, not seconds.
    const date = new Date((timestamp + offset + tz) * 1000);

    return date;
}