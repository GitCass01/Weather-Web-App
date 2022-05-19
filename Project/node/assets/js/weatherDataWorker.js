const { workerData, parentPort } = require('worker_threads');
const JsonDB = require("node-json-db").JsonDB;
const Config = require("node-json-db/dist/lib/JsonDBConfig").Config;
const weatherData = new JsonDB(new Config('./assets/databases/weatherData', true, false, '/'));
const axios = require('axios');
const schedule = require('node-schedule');

// ogni giorno alle 0:30:0 aggiorna weatherData tramite one call api
const job = schedule.scheduleJob('30 0 * * *', updateWeatherData);

// updateWeatherData();                                             // eseguito appena il worker viene startato dal main thread

var intervalId = setInterval(updateCurrentWeatherData, 600000);     // ogni 10 minuti aggiorno tutti i 'current' in weatherData

async function updateCurrentWeatherData() {
    console.log('Aggiorno current weather...');

    const objData = weatherData.getData('/');
    for (const [key, value] of Object.entries(objData)) {
        const lat = value.data.lat;
        const lon = value.data.lon;
        var dataObj = value.data.current;
        await axios.get('https://api.openweathermap.org/data/2.5/weather?lat=' + lat + '&lon=' + lon + '&units=metric&lang=it&appid=' + process.env.API_KEY)
            .then(response => {
                const currentWeather = response.data;
                dataObj.dt = new Date().getTime()/1000;
                dataObj.weather = currentWeather.weather;
                dataObj.wind_speed = currentWeather.wind.speed;
                dataObj.wind_deg = currentWeather.wind.deg;
                dataObj.temp = currentWeather.main.temp;
                dataObj.feels_like = currentWeather.main.feels_like;
                dataObj.humidity = currentWeather.main.humidity;
                dataObj.pressure = currentWeather.main.pressure;

                //console.log(key, " : ", dataObj);
                weatherData.push('/' + key + '/dt', new Date().getTime());
                weatherData.push('/' + key + '/data/current', dataObj);
            })
            .catch(error => {
                console.log(error);
            });
    }

    parentPort.postMessage({
        status: 'current weather in weatherData Aggiornato in data: ' + new Date().toLocaleString()
    })
}

async function updateWeatherData() {
    console.log('Aggiorno weatherData...');

    const objData = weatherData.getData('/');
    for (const [key, value] of Object.entries(objData)) {
        const lat = value.data.lat;
        const lon = value.data.lon;

        await axios.get('https://api.openweathermap.org/data/2.5/onecall?lat=' + lat + '&lon=' + lon + '&exclude=minutely&units=metric&lang=it&appid=' + process.env.API_KEY)
            .then(response => {
                weatherData.push('/' + key, {
                    dt: new Date().getTime(),
                    data: response.data
                });
            })
            .catch(error => {
                console.log(error);
            });
    }

    parentPort.postMessage({
        status: 'weatherData Aggiornato in data: ' + new Date().toLocaleString()
    })
}