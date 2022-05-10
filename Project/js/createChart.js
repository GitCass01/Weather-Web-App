// retrieving temperature (max, min) from 5 days ago (historical data from openweather.com)
// and weekly (8 days - today included) temperature (max, min) 
async function findTempData(lat, lon) {
    const dates = [];
    const temp_max = [];
    const temp_min = [];

    const today = new Date();
    for (let i = 5; i >= 1; i--) {
        let pastDate = Math.round(new Date().setDate(today.getDate() - i) / 1000); // voglio la data in secondi per openweathermap
        
        const onecall_url = 'https://api.openweathermap.org/data/2.5/onecall/timemachine?';
        const params = {
            lat: lat,
            lon: lon,
            dt: pastDate,
            units: 'metric',
            lang: 'it',
            appid: 'fb1d036e9880437a98ec66f6e4daab01'
        }
        const query_weather = new URLSearchParams(params).toString().replaceAll("%2C", ",");
        const call = onecall_url + query_weather;

        await fetch(call)
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

    const onecall_url = 'https://api.openweathermap.org/data/2.5/onecall?';
    const params = {
        lat: lat,
        lon: lon,
        exclude: 'current,minutely,hourly,alerts',
        units: 'metric',
        lang: 'it',
        appid: 'fb1d036e9880437a98ec66f6e4daab01'
    }
    const query_weather = new URLSearchParams(params).toString().replaceAll("%2C", ",");
    const call = onecall_url + query_weather;

    await fetch(call)
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

    return { dates, temp_max, temp_min };
}

async function generateChart(lat, lon) {
    const info = await findTempData(lat, lon);
    //console.log(info);

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
}