const express = require('express');
const path = require('path');
const axios = require('axios'); // utile per semplificare le chiamate alle api - rispetto al normale 'http', dato che 'fetch' non è ancora supportato in nodejs
const bodyParser = require('body-parser');  // necessario per leggere il contenuto del 'body' di una richiesta in POST
// database json
const JsonDB = require("node-json-db").JsonDB;
const Config = require("node-json-db/dist/lib/JsonDBConfig").Config;
const { Worker, workerData } = require('worker_threads')

// Configure dotenv package
require("dotenv").config();

const app = express();
const port = process.env.PORT || 8080;

// weatherDataWorker thread
const weatherDataWorker = new Worker(__dirname + '/assets/js/weatherDataWorker.js', { workerData: 'Prova' });
weatherDataWorker.on("message", result => {
    console.log(result);
});
weatherDataWorker.on("error", error => {
    console.log(error);
});
weatherDataWorker.on("exit", exitCode => {
    console.log(exitCode);
})

// chartWorker thread
const chartWorker = new Worker(__dirname + '/assets/js/chartWorker.js', { workerData: 'Prova' });
chartWorker.on("message", result => {
    console.log(result);
});
chartWorker.on("error", error => {
    console.log(error);
});
chartWorker.on("exit", exitCode => {
    console.log(exitCode);
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

app.post('/geo', async function (req, res) {
    await axios.get('https://api.openweathermap.org/geo/1.0/direct?q=' + req.body.city + '&limit=5&appid=' + process.env.API_KEY)
        .then(response => {
            res.send(response.data);
        })
        .catch(error => {
            console.log(error);
        });
});

app.post('/weatherData', async function (req, res) {
    //console.log('invio risposta api weatherData');
    const today = new Date().getTime();
    try {
        // il metodo getData() ritorna un errore se non esiste la entry nel deb
        weatherData.getData('/' + req.body.city);
    } catch (error) {
        console.log('Creo weatherData per ' + req.body.city);
        await axios.get('https://api.openweathermap.org/data/2.5/onecall?lat=' + req.body.lat + '&lon=' + req.body.lon + '&exclude=minutely&units=metric&lang=it&appid=' + process.env.API_KEY)
            .then(response => {
                weatherData.push('/' + req.body.city, {
                    dt: new Date().getTime(),
                    data: response.data
                });
            })
            .catch(error => {
                console.log(error);
            });
    }
    res.send(weatherData.getData('/' + req.body.city + '/data'));
});

app.post('/chartTemperatures', async function (req, res) {
    try {
        chartTemperatures.getData('/' + req.body.city);
    } catch (error) {
        console.log('Creo chartTemperatures e chartRains per: ' + req.body.city);
        await getChartData(req);
    }
    res.send(chartTemperatures.getData('/' + req.body.city + '/data'));
});

app.post('/chartRains', async function (req, res) {
    res.send(chartRains.getData('/' + req.body.city + '/data'));
});

async function getOldData(req) {
    const today = new Date();
    const arrOldData = [];
    for (let i = 5; i >= 1; i--) {
        let pastDate = Math.round(new Date().setDate(today.getDate() - i) / 1000); // voglio la data in secondi per openweathermap

        await axios.get('https://api.openweathermap.org/data/2.5/onecall/timemachine?lat=' + req.body.lat + '&lon=' + req.body.lon + '&dt=' + pastDate + '&units=metric&lang=it&appid=' + process.env.API_KEY)
            .then(response => {
                arrOldData.push(response.data);
            })
            .catch(error => {
                console.log(error);
            });
    }

    return arrOldData;
};

async function getChartData(req) {
    const dates = [];
    const temp_max = [];
    const temp_min = [];
    const rain_total_mm = [];

    const arrOldData = await getOldData(req);
    arrOldData.forEach(daysBefore => {
        dates.push(timestampToDate(daysBefore.current.dt, daysBefore.timezone_offset).toLocaleDateString());

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

    const daily = weatherData.getData('/' + req.body.city + '/data/daily');
    const timezone_offset = weatherData.getData('/' + req.body.city + '/data/timezone_offset');
    for (let i = 0; i < 8; i++) {
        dates.push(timestampToDate(daily[i].dt, timezone_offset).toLocaleDateString());
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
    chartTemperatures.push('/' + req.body.city, {
        dt: new Date().getTime(),
        data: dataTemp
    });

    // salvo i dati nel db 'chartRains'
    chartRains.push('/' + req.body.city, {
        dt: new Date().getTime(),
        data: dataRain
    });
}

// conversione da timestamp Unix, UTC in data
function timestampToDate(timestamp, offset) {
    const tz = new Date('August 19, 1975 23:15:30').getTimezoneOffset() * 60;
    // multiplied by 1000 so that the argument is in milliseconds, not seconds.
    var date = new Date((timestamp + offset + tz) * 1000);

    return date;
}

app.listen(port);
console.log(new Date().toLocaleString() + ': Server started at http://localhost:' + port);