const { workerData, parentPort } = require('worker_threads');
const JsonDB = require("node-json-db").JsonDB;
const Config = require("node-json-db/dist/lib/JsonDBConfig").Config;
const weatherData = new JsonDB(new Config('./assets/databases/weatherData', true, false, '/'));
const chartTemperatures = new JsonDB(new Config('./assets/databases/chartTemperatures', true, false, '/'));
const chartRains = new JsonDB(new Config('./assets/databases/chartRains', true, false, '/'));
const axios = require('axios');
const schedule = require('node-schedule');
const logger = require("./logger");

// ogni giorno alle 0:30:0 aggiorna weatherData tramite one call api
const jobWeather = schedule.scheduleJob('30 0 * * *', updateWeatherData);
// oppure se le saveDate sono di un giorno precedente (il server era 'spento' alle 0:30:0 e non ha aggiornato automaticamente)
try {
    const saveDate = new Date(weatherData.getData('/' + Object.keys(weatherData.getData('/'))[0] + '/dt'));
    const today = new Date();
    if (!(saveDate.getDate() === today.getDate() && saveDate.getMonth() === today.getMonth() && saveDate.getFullYear() === today.getFullYear())) {
        updateWeatherData();
    }
} catch (error) { }

 updateWeatherData();
// updateChartData();

var intervalId = setInterval(updateCurrentWeatherData, 600000);     // ogni 10 minuti aggiorno tutti i 'current' in weatherData

async function updateCurrentWeatherData() {
    //console.log('Aggiorno current weather...');
    logger.debug('Aggiorno current weather...');

    const objData = weatherData.getData('/');
    for (const [key, value] of Object.entries(objData)) {
        const lat = value.data.lat;
        const lon = value.data.lon;
        var dataObj = value.data.current;
        await axios.get('https://api.openweathermap.org/data/2.5/weather?lat=' + lat + '&lon=' + lon + '&units=metric&lang=it&appid=' + process.env.API_KEY)
            .then(response => {
                const currentWeather = response.data;
                dataObj.dt = Math.floor(new Date().getTime() / 1000);
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
        status: 'current weather in weatherData Aggiornato'
    })
}

async function updateWeatherData() {
    //console.log('Aggiorno weatherData...');
    logger.debug('Aggiorno weatherData...');

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

    // dopo aver aggiornato i weatherData aggiorno i chartData
    updateChartData();

    parentPort.postMessage({
        status: 'weatherData Aggiornato'
    })
}

async function getOldData(lat, lon) {
    const today = new Date();
    const arrOldData = [];
    for (let i = 5; i >= 1; i--) {
        let pastDate = Math.round(new Date().setDate(today.getDate() - i) / 1000); // voglio la data in secondi per openweathermap

        await axios.get('https://api.openweathermap.org/data/2.5/onecall/timemachine?lat=' + lat + '&lon=' + lon + '&dt=' + pastDate + '&units=metric&lang=it&appid=' + process.env.API_KEY)
            .then(response => {
                arrOldData.push(response.data);
            })
            .catch(error => {
                console.log(error);
            });
    }

    return arrOldData;
};

async function updateChartData() {
    logger.debug('Aggiorno chartTemperatures e chartRains...')
    const objData = weatherData.getData('/');
    for (const [key, value] of Object.entries(objData)) {
        const lat = value.data.lat;
        const lon = value.data.lon;

        // console.log('chartTemperature e chartRains per ' + key);
        await getChartTempRain(lat, lon, key);
    }

    parentPort.postMessage({
        status: 'chartTemperatures, chartRains Aggiornati',
        code: 'update'
    })
}


async function getChartTempRain(lat, lon, city) {
    const dates = [];
    const temp_max = [];
    const temp_min = [];
    const rain_total_mm = [];

    const arrOldData = await getOldData(lat, lon);
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

            if (daysBefore.hourly[i].rain) {
                mm += daysBefore.hourly[i].rain["1h"];
            }
        }

        temp_max.push(Math.round(max));
        temp_min.push(Math.round(min));
        rain_total_mm.push(mm);
    });

    const daily = weatherData.getData('/' + city + '/data/daily');
    const timezone_offset = weatherData.getData('/' + city + '/data/timezone_offset');
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

    //console.log('chartTemperature per ' + city);
    // salvo i dati nel db 'chartTemperatures'
    chartTemperatures.push('/' + city, {
        dt: new Date().getTime(),
        data: dataTemp
    });

    //console.log('chartRains per: ' + city);
    // salvo i dati nel db 'chartRains'
    chartRains.push('/' + city, {
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