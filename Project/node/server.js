const express = require('express');
const path = require('path');
const axios = require('axios'); // utile per semplificare le chiamate alle api - rispetto al normale 'http', dato che 'fetch' non è ancora supportato in nodejs
const bodyParser = require('body-parser');  // necessario per leggere il contenuto del 'body' di una richiesta in POST
// database json
const JsonDB = require("node-json-db").JsonDB;
const Config = require("node-json-db/dist/lib/JsonDBConfig").Config;

// Configure dotenv package
require("dotenv").config();

const app = express();
const port = process.env.PORT || 8080;

/*
    weatherData/oldData: {
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
const oldData = new JsonDB(new Config(__dirname + '/assets/databases/oldData', true, false, '/')); //5gg precedenti
var chartTemperatures = new JsonDB(new Config(__dirname + '/assets/databases/chartTemperatures', true, false, '/'));
var chartRains = new JsonDB(new Config(__dirname + '/assets/databases/chartRains', true, false, '/'));

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
        const saveDate = weatherData.getData('/' + req.body.city + '/dt');
        if (parseInt(Math.abs(saveDate - today) / (1000 * 60) % 60) >= 10) {
            console.log('Aggiorno weatherData per ' + req.body.city);
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
        const saveDate = chartTemperatures.getData('/' + req.body.city + '/dt');
        if (new Date(saveDate).toDateString() != new Date().toDateString()) {
            console.log('Aggiorno dati chartTemperatures per: ' + req.body.city);
            await updateChartTemperatures(req);
        }
    } catch (error) {
        console.log('Creo entry chartTemperatures per: ' + req.body.city);
        chartTemperatures.push('/' + req.body.city, {});
        await updateChartTemperatures(req);
    }
    res.send(chartTemperatures.getData('/' + req.body.city + '/data'));
});

app.post('/chartRains', async function (req, res) {
    try {
        const saveDate = chartRains.getData('/' + req.body.city + '/dt');
        if (new Date(saveDate).toDateString() != new Date().toDateString()) {
            console.log('Aggiorno dati chartRains per: ' + req.body.city);
            await updateChartRains(req);
        }
    } catch (error) {
        console.log('Creo entry chartRains per: ' + req.body.city);
        chartRains.push('/' + req.body.city, {});
        await updateChartRains(req);
    }
    res.send(chartRains.getData('/' + req.body.city + '/data'));
});

// conversione da timestamp Unix, UTC in data
function timestampToDate(timestamp, offset) {
    const tz = new Date('August 19, 1975 23:15:30').getTimezoneOffset() * 60;
    // multiplied by 1000 so that the argument is in milliseconds, not seconds.
    var date = new Date((timestamp + offset + tz) * 1000);

    return date;
}

async function getOldData(req, dt) {
    const today = new Date().getTime();
    try {
        const saveDate = oldData.getData('/' + req.body.city + '/dt');
        if (new Date(saveDate).toDateString() != new Date().toDateString()) {
            console.log('Aggiorno oldData per ' + req.body.city);
            await axios.get('https://api.openweathermap.org/data/2.5/onecall/timemachine?lat=' + req.body.lat + '&lon=' + req.body.lon + '&dt=' + dt + '&units=metric&lang=it&appid=' + process.env.API_KEY)
                .then(response => {
                    oldData.push('/' + req.body.city, {
                        dt: new Date().getTime(),
                        data: response.data
                    });
                    data = response.data;
                })
                .catch(error => {
                    console.log(error);
                });
        }
    } catch (error) {
        console.log('Creo oldData per ' + req.body.city);
        await axios.get('https://api.openweathermap.org/data/2.5/onecall/timemachine?lat=' + req.body.lat + '&lon=' + req.body.lon + '&dt=' + dt + '&units=metric&lang=it&appid=' + process.env.API_KEY)
            .then(response => {
                oldData.push('/' + req.body.city, {
                    dt: new Date().getTime(),
                    data: response.data
                });
                data = response.data;
            })
            .catch(error => {
                console.log(error);
            });
    }

    return oldData.getData('/' + req.body.city + '/data');
};

async function updateChartTemperatures(req) {
    const dates = [];
    const temp_max = [];
    const temp_min = [];

    const today = new Date();
    for (let i = 5; i >= 1; i--) {
        let pastDate = Math.round(new Date().setDate(today.getDate() - i) / 1000); // voglio la data in secondi per openweathermap

        const oldData = await getOldData(req, pastDate);

        dates.push(timestampToDate(pastDate, oldData.timezone_offset).toLocaleDateString());

        // l'api non fornisce la temp max e min relative ai giorni precedenti (historical)
        // quindi itero sulle ore del giorno e ricavo le temp max e min
        let max = oldData.current.temp;
        let min = oldData.current.temp;
        for (let i = 0; i < 24; i++) {
            let tmp = oldData.hourly[i].temp;
            if (tmp < min) {
                min = tmp;
            }
            if (tmp > max) {
                max = tmp;
            }
        }

        temp_max.push(Math.round(max));
        temp_min.push(Math.round(min));

    }

    const saveDate = weatherData.getData('/' + req.body.city);
    if (parseInt(Math.abs(saveDate.dt - today) / (1000 * 60) % 60) >= 10) { // se sono passati 10 minuti
        console.log('Aggiorno weatherData per ' + req.body.city);
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

    const daily = weatherData.getData('/' + req.body.city + '/data/daily');
    const timezone_offset = weatherData.getData('/' + req.body.city + '/data/timezone_offset');
    for (let i = 0; i < 8; i++) {
        dates.push(timestampToDate(daily[i].dt, timezone_offset).toLocaleDateString());
        temp_max.push(Math.round(daily[i].temp.max));
        temp_min.push(Math.round(daily[i].temp.min));
    }

    const data = { dates, temp_max, temp_min };

    // salvo i dati nel db 'chartTemperatures'
    chartTemperatures.push('/' + req.body.city, {
        dt: new Date().getTime(),
        data: data
    });
}

async function updateChartRains(req) {
    const dates = [];
    const rain_total_mm = [];

    const today = new Date();
    for (let i = 5; i >= 1; i--) {
        let pastDate = Math.round(new Date().setDate(today.getDate() - i) / 1000); // voglio la data in secondi per openweathermap

        const oldData = await getOldData(req, pastDate);

        dates.push(timestampToDate(pastDate, oldData.timezone_offset).toLocaleDateString());

        // l'api non fornisce l'umidità max e min relative ai giorni precedenti (historical)
        // quindi itero sulle ore del giorno e ricavo l'umidità max e min
        let mm = 0;
        for (let i = 0; i < 24; i++) {
            if (oldData.hourly[i].rain) {
                mm += oldData.hourly[i].rain["1h"];
            }
        }
        rain_total_mm.push(mm);

    }

    const saveDate = weatherData.getData('/' + req.body.city);
    if (parseInt(Math.abs(saveDate.dt - today) / (1000 * 60) % 60) >= 10) { // se sono passati 10 minuti
        console.log('Aggiorno weatherData per ' + req.body.city);
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

    const daily = weatherData.getData('/' + req.body.city + '/data/daily');
    const timezone_offset = weatherData.getData('/' + req.body.city + '/data/timezone_offset');
    for (let i = 0; i < 8; i++) {
        dates.push(timestampToDate(daily[i].dt, timezone_offset).toLocaleDateString());

        let mm = 0;
        if (daily[i].rain) {
            mm = daily[i].rain;
        }
        rain_total_mm.push(mm);
    }

    const data = { dates, rain_total_mm };

    // salvo i dati nel db 'chartRains'
    chartRains.push('/' + req.body.city, {
        dt: new Date().getTime(),
        data: data
    });
}

app.listen(port);
console.log('Server started at http://localhost:' + port);