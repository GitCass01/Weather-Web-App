function generateChart() {
    const city = JSON.parse(localStorage.getItem('cityWeekly'));

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

    if (window.Worker) {
        const myWorker = new Worker("js/chartWorker.js");

        myWorker.postMessage(JSON.stringify({ city: city }));

        myWorker.onmessage = function (e) {
            //console.log('Message received from worker');

            let info = JSON.parse(e.data);
            //console.log(info);

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
                            },
                            ticks: {
                                callback: function(value) {
                                    return value + '°C'
                                }
                            }
                        },
                        x: {
                            title: {
                                display: true,
                                text: 'Giorni'
                            },
                            ticks: {
                                callback: function (value, index) {
                                    if (index === 5) {
                                        return this.getLabelForValue(value) + '\n(Oggi)'
                                    } else {
                                        return this.getLabelForValue(value)
                                    }
                                },
                                color: (c) => {
                                    if (c.index === 5) {
                                        return 'red'
                                    } else {
                                        return 'black'
                                    }
                                }
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
                    animation: false,   // meno carino ma aumenta le performance
                }
            });

            // i due event listener per il cambio di chart
            document.getElementById('temperature').addEventListener('click', async (e) => {
                let temp_data;
                await fetch('/chartTemperatures?city=' + city.name + '&lat=' + city.lat + '&lon=' + city.lon)
                    .then(response => response.json())
                    .then(result => {
                        temp_data = result;
                    })
                    .catch(err => console.log("err: ", err));

                myChart.config.type = 'line';
                myChart.config.options.scales.y.title.text = 'Gradi Celsius';
                myChart.config.options.plugins.title.text = 'Grafico delle Temperature Massime e Minime';
                var data = myChart.config.data;

                data.datasets[0].data = temp_data.temp_max;
                data.datasets[0].label = 'temperatura massima';
                const obj = {
                    label: 'temperatura minima',
                    data: temp_data.temp_min,
                    borderColor: 'rgba(0, 0, 255, 0.6)',
                    borderWidth: 2,
                    tension: 0.1,
                };
                if (data.datasets.length == 2) {
                    data.datasets.pop();
                }
                data.datasets.push(obj);
                data.labels = temp_data.dates;
                myChart.update();
            });

            document.getElementById('rain').addEventListener('click', async (e) => {
                let rain;
                await fetch('/chartRains?city=' + city.name + '&lat=' + city.lat + '&lon=' + city.lon)
                    .then(response => response.json())
                    .then(result => {
                        rain = result;
                    })
                    .catch(err => console.log("err: ", err));

                myChart.config.type = 'bar';
                myChart.config.options.scales.y.title.text = 'mm (millimetri)';
                myChart.config.options.plugins.title.text = 'Grafico del totale di pioggia in mm';
                var data = myChart.config.data;
                data.datasets[0].data = rain.rain_total_mm;
                data.datasets[0].label = 'totale pioggia(mm)';
                if (data.datasets.length == 2) {
                    data.datasets.pop();
                }
                data.labels = rain.dates;
                myChart.update();
            });
        }
    } else {
        console.log('Il tuo browser non supporta i Web Worker.');
    }
}