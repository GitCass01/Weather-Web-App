const { workerData, parentPort } = require('worker_threads');
const JsonDB = require("node-json-db").JsonDB;
const Config = require("node-json-db/dist/lib/JsonDBConfig").Config;
const weatherData = new JsonDB(new Config('./assets/databases/weatherData', true, false, '/'));
const oldData = new JsonDB(new Config('./assets/databases/oldData', true, false, '/'));
const chartTemperatures = new JsonDB(new Config('./assets/databases/chartTemperatures', true, false, '/'));
const chartRains = new JsonDB(new Config('./assets/databases/chartRains', true, false, '/'));
const axios = require('axios');
const schedule = require('node-schedule');

// ogni giorno alle 0:30:0 aggiorna i chartData
const job = schedule.scheduleJob('30 0 * * *', updateChartData);

//updateChartData();

async function updateChartData() {
    const today = new Date().getTime();
    console.log('Aggiorno weatherData...');

    const objData = weatherData.getData('/');
    for (const [key, value] of Object.entries(objData)) {
        const lat = value.data.lat;
        const lon = value.data.lon;

        await updateOldData(lat, lon, key);
        await updateChartTemperatures(key);
        await updateChartRains(key);
    }

    parentPort.postMessage({
        status: new Date().toLocaleString() + ': oldData, chartTemperatures, chartRains Aggiornati'
    })
}

async function updateOldData(lat, lon, city) {
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

    console.log('Aggiorno oldData per ' + city);
    oldData.push('/' + city, {
        dt: new Date().getTime(),
        data: arrOldData
    });
}

async function updateChartTemperatures(city) {
    const dates = [];
    const temp_max = [];
    const temp_min = [];

    const arrOldData = oldData.getData('/' + city + '/data');
    arrOldData.forEach(daysBefore => {
        dates.push(timestampToDate(daysBefore.current.dt, daysBefore.timezone_offset).toLocaleDateString());

        // l'api non fornisce la temp max e min relative ai giorni precedenti (historical)
        // quindi itero sulle ore del giorno e ricavo le temp max e min
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
        }

        temp_max.push(Math.round(max));
        temp_min.push(Math.round(min));
    });

    const daily = weatherData.getData('/' + city + '/data/daily');
    const timezone_offset = weatherData.getData('/' + city + '/data/timezone_offset');
    for (let i = 0; i < 8; i++) {
        dates.push(timestampToDate(daily[i].dt, timezone_offset).toLocaleDateString());
        temp_max.push(Math.round(daily[i].temp.max));
        temp_min.push(Math.round(daily[i].temp.min));
    }

    const data = { dates, temp_max, temp_min };

    console.log('Aggiorno chartTemperatures per ' + city);
    // salvo i dati nel db 'chartTemperatures'
    chartTemperatures.push('/' + city, {
        dt: new Date().getTime(),
        data: data
    });
}

async function updateChartRains(city) {
    const dates = [];
    const rain_total_mm = [];

    const arrOldData = oldData.getData('/' + city + '/data');
    arrOldData.forEach(daysBefore => {
        dates.push(timestampToDate(daysBefore.current.dt, daysBefore.timezone_offset).toLocaleDateString());

        // l'api non fornisce l'umidità max e min relative ai giorni precedenti (historical)
        // quindi itero sulle ore del giorno e ricavo l'umidità max e min
        let mm = 0;
        for (let i = 0; i < 24; i++) {
            if (daysBefore.hourly[i].rain) {
                mm += daysBefore.hourly[i].rain["1h"];
            }
        }
        rain_total_mm.push(mm);
    });

    const daily = weatherData.getData('/' + city + '/data/daily');
    const timezone_offset = weatherData.getData('/' + city + '/data/timezone_offset');
    for (let i = 0; i < 8; i++) {
        dates.push(timestampToDate(daily[i].dt, timezone_offset).toLocaleDateString());

        let mm = 0;
        if (daily[i].rain) {
            mm = daily[i].rain;
        }
        rain_total_mm.push(mm);
    }

    const data = { dates, rain_total_mm };

    console.log('Aggiorno chartRains per ' + city);
    // salvo i dati nel db 'chartRains'
    chartRains.push('/' + city, {
        dt: new Date().getTime(),
        data: data
    });
}

// conversione da timestamp Unix, UTC in data
function timestampToDate(timestamp, offset) {
    const tz = new Date('August 19, 1975 23:15:30').getTimezoneOffset() * 60;
    // multiplied by 1000 so that the argument is in milliseconds, not seconds.
    var date = new Date((timestamp + offset + tz) * 1000);

    return date;
}