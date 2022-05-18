const { workerData, parentPort } = require('worker_threads');
const JsonDB = require("node-json-db").JsonDB;
const Config = require("node-json-db/dist/lib/JsonDBConfig").Config;
const weatherData = new JsonDB(new Config('./assets/databases/weatherData', true, false, '/'));
const axios = require('axios');

// updateWeatherData();                                        // eseguito appena il worker viene startato dal main thread

var intervalId = setInterval(updateWeatherData, 600000);    // ogni 10 minuti

async function updateWeatherData() {
    const today = new Date().getTime();
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
        status: 'weatherData Aggiornato'
    })
}