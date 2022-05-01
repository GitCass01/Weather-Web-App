const ctx = document.getElementById('myChart').getContext('2d');
const myChart = new Chart(ctx, {
    type: 'line',
    data: {
        labels: ['10/04/2022', '11/04/2022', '12/04/2022', '13/04/2022', '14/04/2022', '15/04/2022'],
        datasets: [
            {
                label: 'temperatura massima',
                data: [26, 24, 27, 22, 20, 21],
                borderColor: 'rgba(255, 99, 132, 1)',
                borderWidth: 2,
                tension: 0.1,
            },
            {
                label: 'temperatura minima',
                data: [22, 15, 16, 18, 16, 14],
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
