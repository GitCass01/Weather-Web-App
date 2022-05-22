// necessario per evitare le ambiguità causati dai nomi
const cityHomePage = {
    'Milano, IT': { lat: 45.463619, lon: 9.188120 },
    'Londra, GB': { lat: 51.507351, lon: -0.127758 },
    'Tokyo, JP': { lat: 35.689487, lon: 139.691711 },
    'New York, US': { lat: 40.712776, lon: -74.005974 }
};

// funzione per mostrare la card specifica per la città innserita nella search bar + current weather
async function showMe(lat, lon, fullName) {
    let card = document.getElementById('hidden-card');

    card.style.display = 'block';
    document.getElementById('city').innerText = fullName.split(" : ")[0];
    setWeather(fullName, lat, lon, 'hidden-card-body');
}

// CURRENT WEATHER (card in homepage: Milano, Londra, Tokyo, New York)
// direct geocoding call : http://api.openweathermap.org/geo/1.0/direct?q=Milano&limit=3&appid={API_KEY}
// one call api : https://api.openweathermap.org/data/2.5/onecall?lat=xxxx&lon=xxxx&exclude=minutely,hourly,daily&units=metric&lang=it&appid={API_KEY}
function currentWeatherHomePage() {
    setWeather('Milano, IT : Lombardy', cityHomePage['Milano, IT'].lat, cityHomePage['Milano, IT'].lon, 'card-milano');
    setWeather('Londra, GB : England', cityHomePage['Londra, GB'].lat, cityHomePage['Londra, GB'].lon, 'card-londra');
    setWeather('Tokyo, JP', cityHomePage['Tokyo, JP'].lat, cityHomePage['Tokyo, JP'].lon, 'card-tokyo');
    setWeather('New York, US : New York', cityHomePage['New York, US'].lat, cityHomePage['New York, US'].lon, 'card-newyork');
}

// funzione per la ricerca e l'inserimento del meteo nelle card
async function setWeather(city, lat, lon, id_card) {
    await fetch("/weatherData", {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify({ 'city': city, 'lat': lat, 'lon': lon }),
    })
        .then(response => response.json())
        .then(result => {
            console.log(result);
            let citycard = document.getElementById(id_card).children;

            citycard[0].innerText = timestampToDate(parseInt(new Date().getTime() / 1000), result.timezone_offset).toLocaleString();
            citycard[1].src = "https://openweathermap.org/img/wn/" + result.current.weather[0].icon + "@2x.png";
            citycard[1].alt = result.current.weather[0].description;
            citycard[2].innerText = Math.round(result.current.temp) + "° " + result.current.weather[0].description;
            if (result.alerts) {
                // se è presente un'alert allora mostro il 'badge' dell'alert
                // creo un 'modal' (pop up) in cui, cliccando sul badge, mostrerò i dettagli dell'alert
                // 'abilito' il badge relativo alle allerte meteo
                citycard[3].style.display = 'block';
                //console.log(result.alerts);
                citycard[3].innerText = result.alerts[0].event;
                if (result.alerts.length > 1) {
                    citycard[3].innerText += " (+" + result.alerts.length + " allerte)";
                }
                citycard[3].setAttribute('data-bs-toggle', 'modal');
                citycard[3].setAttribute('data-bs-target', '#alertPopUp-' + id_card);
                citycard[3].classList.add("custom-alert");
                createAlertModal(id_card, result.alerts);
            }
            const lis = citycard[4].getElementsByTagName("li");
            lis[0].innerText = "Umidità: " + result.current.humidity + "%";
            lis[1].innerText = "Pressione: " + result.current.pressure + " hPa";
            lis[2].innerText = "Vento: " + result.current.wind_speed + " m/s " + degToCompass(result.current.wind_deg);
        })
        .catch((error) => {
            console.error('Error:', error);
        });
}

// salva le info della città cliccata (card) per mostrare le previsioni settimanali
function saveCity(fullName) {
    const name = fullName.split(" : ")[0];
    localStorage.setItem('cityWeekly', JSON.stringify({ 'name': fullName, 'lat': cityHomePage[name].lat, 'lon': cityHomePage[name].lon }));
}


const contactMe = document.getElementById('btnContactMe');
contactMe.addEventListener('click', (e) => {
    e.preventDefault();

    const name = document.getElementById('user-name');
    const surname = document.getElementById('user-surname');
    const email = document.getElementById('user-email');
    const text = document.getElementById('user-comment');

    const contactData = {
        name: name.value,
        surname: surname.value,
        email: email.value,
        message: text.value
    }

    fetch('/contactMe', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify(contactData),
    })
        .then(response => response.json())
        .then(result => {
            if (result.code === 'Success') {
                alert('Mail inviata');
            }
        })
        .catch(err => console.log("err: ", err));
});