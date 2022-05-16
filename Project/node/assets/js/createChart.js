// 'database' locale
/*  struttura degli oggetti salvati in localStorage (stessa cosa per chartRains)
    'chartTemperatures' =  {
        'Buccinasco, IT': {
            'dt': data_caricamento_dati,
            'data': {
                'dates': [],
                'temp_max': [],
                'temp_min': [],
            }
        },
        ...
    }
*/
if (!localStorage.getItem('chartTemperatures')) {
    console.log('Creo chartTemperatures...');
    const chartTemperatures = JSON.stringify({});
    localStorage.setItem('chartTemperatures', chartTemperatures);
}
if (!localStorage.getItem('chartRains')) {
    console.log('Creo chartRains...');
    const chartRains = JSON.stringify({});
    localStorage.setItem('chartRains', chartRains);
}

// check if the local data (rain/temperature) are present and up to date, if not it retrieve this data
// generate the 'default' chart -> temperature chart
async function generateChart() {
    const city = JSON.parse(localStorage.getItem('cityWeekly'));
    // controllo se i dati delle temperature (chart di default) sono presenti e aggiornati
    if (JSON.parse(localStorage.getItem('chartTemperatures'))[city.name]) {
        // se i dati sono 'del giorno prima' di un giorno li aggiorno
        const saveDate = new Date(JSON.parse(localStorage.getItem('chartTemperatures'))[city.name].dt);
        if (saveDate.toDateString() != new Date().toDateString()) {
            console.log('Aggiorno dati');
            await findTempData(city.lat, city.lon);
        }
    } else {
        console.log('Creo dati temperature');
        await findTempData(city.lat, city.lon);
    }

    const info = JSON.parse(localStorage.getItem('chartTemperatures'))[city.name].data;

    // document.getElementById('chartContainer').innerHTML = "<canvas id='myChart'></canvas>"; --> poco sicuro
    // soluzione:
    if (document.getElementById('chartContainer').children.length == 1) {
        //console.log('cancello il vecchio chart...');
        document.getElementById('chartContainer').children[0].remove();
    }
    const chartContainer = document.getElementById('chartContainer');
    const chart = document.createElement('canvas');
    chart.id = 'myChart';
    chartContainer.appendChild(chart);

    const ctx = document.getElementById('myChart').getContext('2d');
    const myChart = new Chart(ctx, {
        type: 'line',
        data: {
            labels: info.dates,
            datasets: [
                {
                    label: 'temperatura massima',
                    data: info.temp_max,
                    borderColor: 'rgba(255, 99, 132, 1)',
                    borderWidth: 2,
                    tension: 0.1,
                },
                {
                    label: 'temperatura minima',
                    data: info.temp_min,
                    borderColor: 'rgba(0, 0, 255, 0.6)',
                    borderWidth: 2,
                    tension: 0.1,
                }
            ]
        },
        options: {
            scales: {
                y: {
                    beginAtZero: true,
                    title: {
                        display: true,
                        text: 'Gradi Celsius'
                    }
                },
                x: {
                    title: {
                        display: true,
                        text: 'Giorni'
                    }
                }
            },
            plugins: {
                title: {
                    display: true,
                    text: 'Grafico delle Temperature Massime e Minime'
                }
            },
            maintainAspectRatio: false,
            interaction: {
                intersect: false,
            },
        }
    });

    // controllo se i dati della pioggia sono presenti e aggiornati
    if (JSON.parse(localStorage.getItem('chartRains'))[city.name]) {
        // se i dati sono 'del giorno prima' di un giorno li aggiorno
        const saveDate = new Date(JSON.parse(localStorage.getItem('chartRains'))[city.name].dt);
        if (saveDate.toDateString() != new Date().toDateString()) {
            console.log('Aggiorno dati');
            const data = await findRainData(city.lat, city.lon);
        }
    } else {
        console.log('Creo dati pioggia');
        await findRainData(city.lat, city.lon);
    }

    // i due event listener per il cambio di chart
    document.getElementById('temperature').addEventListener('click', async (e) => {
        const city = JSON.parse(localStorage.getItem('cityWeekly')).name;

        myChart.config.type = 'line';
        myChart.config.options.scales.y.title.text = 'Gradi Celsius';
        myChart.config.options.plugins.title.text = 'Grafico delle Temperature Massime e Minime';
        var data = myChart.config.data;

        const temp_data = JSON.parse(localStorage.getItem('chartTemperatures'))[city].data;

        data.datasets[0].data = temp_data.temp_max;
        data.datasets[0].label = 'temperatura massima';
        const obj = {
            label: 'temperatura minima',
            data: info.temp_min,
            borderColor: 'rgba(0, 0, 255, 0.6)',
            borderWidth: 2,
            tension: 0.1,
        };
        data.datasets.push(obj);
        data.labels = temp_data.dates;
        myChart.update();
    });

    document.getElementById('rain').addEventListener('click', async (e) => {
        const city = JSON.parse(localStorage.getItem('cityWeekly')).name;

        const rain = JSON.parse(localStorage.getItem('chartRains'))[city].data;

        myChart.config.type = 'bar';
        myChart.config.options.scales.y.title.text = 'mm (millimetri)';
        myChart.config.options.plugins.title.text = 'Grafico del totale di pioggia in mm';
        var data = myChart.config.data;
        data.datasets[0].data = rain.rain_total_mm;
        data.datasets[0].label = 'totale pioggia(mm)';
        data.datasets.pop();
        data.labels = rain.dates;
        myChart.update();
    });
}

// retrieving temperature (max, min) from 5 days ago (historical data from openweather.com)
// and weekly (8 days - today included) temperature (max, min)
// the info are saved locally into localStorage
async function findTempData(lat, lon) {
    const dates = [];
    const temp_max = [];
    const temp_min = [];

    const today = new Date();
    for (let i = 5; i >= 1; i--) {
        let pastDate = Math.round(new Date().setDate(today.getDate() - i) / 1000); // voglio la data in secondi per openweathermap

        await fetch('oldData', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ 'lat': lat, 'lon': lon, 'dt': pastDate }),
        })
            .then(response => response.json())
            .then(result => {
                //console.log(result);
                dates.push(timestampToDate(pastDate, result.timezone_offset).toLocaleDateString());

                // l'api non fornisce la temp max e min relative ai giorni precedenti (historical)
                // quindi itero sulle ore del giorno e ricavo le temp max e min
                let max = result.current.temp;
                let min = result.current.temp;
                for (let i = 0; i < 24; i++) {
                    let tmp = result.hourly[i].temp;
                    if (tmp < min) {
                        min = tmp;
                    }
                    if (tmp > max) {
                        max = tmp;
                    }
                }

                temp_max.push(Math.round(max));
                temp_min.push(Math.round(min));
            })
            .catch(err => console.log("err: ", err));
    }

    await fetch('/weatherData', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify({ 'lat': lat, 'lon': lon, 'exclude': 'current,minutely,hourly,alerts' }),
    })
        .then(response => response.json())
        .then(result => {
            //console.log(result);
            for (let i = 0; i < 8; i++) {
                dates.push(timestampToDate(result.daily[i].dt, result.timezone_offset).toLocaleDateString());
                temp_max.push(Math.round(result.daily[i].temp.max));
                temp_min.push(Math.round(result.daily[i].temp.min));
            }
        })
        .catch(err => console.log("err: ", err));

    const data = { dates, temp_max, temp_min };

    // aggiorno i dati nel 'database'
    const city = JSON.parse(localStorage.getItem('cityWeekly')).name;
    const dataStored = JSON.parse(localStorage.getItem('chartTemperatures'));
    dataStored[city] = { dt: new Date().getTime(), data: data };
    localStorage.setItem('chartTemperatures', JSON.stringify(dataStored));
}

// retrieving total rain mm from 5 days ago (historical data from openweather.com)
// and weekly (8 days - today included) total rain mm 
// the info are saved locally into localStorage
async function findRainData(lat, lon) {
    const dates = [];
    const rain_total_mm = [];

    const today = new Date();
    for (let i = 5; i >= 1; i--) {
        let pastDate = Math.round(new Date().setDate(today.getDate() - i) / 1000); // voglio la data in secondi per openweathermap

        await fetch('oldData', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ 'lat': lat, 'lon': lon, 'dt': pastDate }),
        })
            .then(response => response.json())
            .then(result => {
                //console.log(result);
                dates.push(timestampToDate(pastDate, result.timezone_offset).toLocaleDateString());

                // l'api non fornisce l'umidità max e min relative ai giorni precedenti (historical)
                // quindi itero sulle ore del giorno e ricavo l'umidità max e min
                let mm = 0;
                for (let i = 0; i < 24; i++) {
                    if (result.hourly[i].rain) {
                        mm += result.hourly[i].rain["1h"];
                    }
                }
                rain_total_mm.push(mm);
            })
            .catch(err => console.log("err: ", err));
    }

    await fetch('/weatherData', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify({ 'lat': lat, 'lon': lon, 'exclude': 'current,minutely,hourly,alerts' }),
    })
        .then(response => response.json())
        .then(result => {
            //console.log(result);
            for (let i = 0; i < 8; i++) {
                dates.push(timestampToDate(result.daily[i].dt, result.timezone_offset).toLocaleDateString());

                let mm = 0;
                if (result.daily[i].rain) {
                    mm = result.daily[i].rain;
                }
                rain_total_mm.push(mm);
            }
        })
        .catch(err => console.log("err: ", err));

    const data = { dates, rain_total_mm };

    // aggiorno i dati nel 'database'
    const city = JSON.parse(localStorage.getItem('cityWeekly')).name;
    const dataStored = JSON.parse(localStorage.getItem('chartRains'));
    dataStored[city] = { dt: new Date().getTime(), data: data };
    localStorage.setItem('chartRains', JSON.stringify(dataStored));
}