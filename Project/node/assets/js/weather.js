// necessario per evitare le ambiguità causati dai nomi
const cityHomePage = {
    'Milano, IT': { lat: 45.463619, lon: 9.188120 },
    'Londra, GB': { lat: 51.507351, lon: -0.127758 },
    'Tokyo, JP': { lat: 35.689487, lon: 139.691711 },
    'New York, US': { lat: 40.712776, lon: -74.005974 }
};

// dà la possibilità all'utente di scegliere la città da un 'suggestion box' rispetto allo 'state' e alla latitudine e longitudine
// in quanto la ricerca per nome introduce ambiguità
async function suggestion(id_suggestion) {
    const city = document.getElementById('floatingInput').value;

    const ul = document.getElementById(id_suggestion);
    ul.style.display = 'block';

    const ulChildren = ul.children;
    const numChildren = ulChildren.length;
    for (let i = 0; i < numChildren; i++) {
        const child = document.getElementById(i);
        ul.removeChild(child);
    }

    await fetch('/geo', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify({ 'city': city }),
    })
        .then(response => response.json())
        .then(result => {
            //console.log(result);
            let arr = [];
            if (result[0]) {
                for (let i = 0; i < result.length; i++) {
                    const li = document.createElement('li');
                    li.id = i;
                    if (result[i].local_names && result[i].local_names.it) {
                        li.innerText = result[i].local_names.it + ", " + result[i].country;
                    } else {
                        li.innerText = result[i].name + ", " + result[i].country;
                    }
                    if (result[i].state) {
                        li.innerText += " : " + result[i].state;
                    }
                    li.setAttribute('onclick', 'select(this)');
                    ul.append(li);
                    const obj = { 'name': li.innerText, lat: result[i].lat, 'lon': result[i].lon };
                    arr.push(obj);
                }
                sessionStorage.setItem('suggestions', JSON.stringify(arr));
            } else {
                alert('Città non trovata!')
            }
        })
        .catch(err => console.log("err: ", err));
}

function select(e) {
    document.getElementById('floatingInput').value = e.innerText;
    const obj = JSON.parse(sessionStorage.getItem('suggestions'));
    const lat = obj[e.id].lat;
    const lon = obj[e.id].lon;
    const fullName = document.getElementById('floatingInput').value;

    const ulId = e.parentNode.id;
    const ul = document.getElementById(ulId);
    const ulChildren = ul.children;
    const numChildren = ulChildren.length
    for (let i = 0; i < numChildren; i++) {
        const child = document.getElementById(i);
        ul.removeChild(child);
    }
    ul.style.display = 'none';
    sessionStorage.removeItem('suggestions');
    localStorage.setItem('cityWeekly', JSON.stringify(obj[e.id]));

    if (ulId === 'indexSuggestion') {
        showMe(lat, lon, fullName);
    } else if (ulId === 'weeklySuggestion') {
        weeklyWeather();
    }
}

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
        body: JSON.stringify({ 'city': city, 'lat': lat, 'lon': lon, 'exclude': 'minutely,hourly,alerts' }),
    })
        .then(response => response.json())
        .then(result => {
            //console.log(result);
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

// weekly (7 days) weather for 'weather.html' page
async function weeklyWeather() {
    // lat, lon source:
    // 1. card clickata nella 'index.html'
    // 2. altrimenti uso Milano come posizione 'placeholder'
    // 3. search box -> aggiorno
    if (!localStorage.getItem('cityWeekly')) {
        localStorage.setItem('cityWeekly', JSON.stringify({ name: 'Milano, IT : Lombardy', lat: 45.463619, lon: 9.188120 }));
    }
    const city = JSON.parse(localStorage.getItem('cityWeekly'));
    const lat = city.lat;
    const lon = city.lon;
    const name = city.name;

    document.getElementById('cityNameWeekly').innerText = "Previsioni settimanali di " + name.split(" : ")[0];

    initializeMap(lat, lon);

    if (window.Worker) {
        const myWorker = new Worker("chartWorker.js");

        myWorker.postMessage(5);

        myWorker.onmessage = function (e) {
            console.log('Message received from worker: ' + e.data);
        }
    } else {
        console.log('Il tuo browser non supporta i Web Worker.');
    }

    await fetch('/weatherData', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify({ 'city': name, 'lat': lat, 'lon': lon, 'exclude': 'minutely' }),
    })
        .then(response => response.json())
        .then(result => {
            //console.log(result);
            const current_weather = result.current;
            const daily_weather = result.daily;
            const hourly = result.hourly;
            //console.log(current_weather);

            currentWeather(result, current_weather);
            hourlyWeather(result, hourly);
            dailyWeather(result, daily_weather);
            generateChart();
        })
        .catch(err => console.log("err: ", err));
}

function currentWeather(result, current_weather) {
    //current weather
    const current_card = document.getElementById('current-weather').children;
    current_card[0].innerText = timestampToDate(parseInt(new Date().getTime() / 1000), result.timezone_offset).toLocaleString();
    current_card[1].src = "https://openweathermap.org/img/wn/" + current_weather.weather[0].icon + "@2x.png";
    current_card[1].alt = current_weather.weather[0].description;
    current_card[2].innerText = Math.round(current_weather.temp) + "°C - " + current_weather.weather[0].description;
    if (result.alerts) {
        current_card[3].style.display = 'block';
        current_card[3].innerText = result.alerts[0].event;
        if (result.alerts.length > 1) {
            current_card[3].innerText += " (+" + result.alerts.length + " allerte)";
        }
        current_card[3].classList.add("custom-alert");
        current_card[3].setAttribute('data-bs-toggle', 'modal');
        current_card[3].setAttribute('data-bs-target', '#alertPopUp-');
        createAlertModal('', result.alerts);
    }
    const lis = current_card[4].getElementsByTagName("li");
    lis[0].innerText = "Umidità: " + current_weather.humidity + "%";
    lis[1].innerText = "Pressione: " + current_weather.pressure + " hPa";
    lis[2].innerText = "Vento: " + current_weather.wind_speed + "m/s " + degToCompass(result.current.wind_deg);
}

function hourlyWeather(result, hourly) {
    //hourly weather: 24h 
    /**
     *  <div class="col-md-3 border border-top-0 border-start-0 border-bottom-0 border-2">
          <h5>9:00 - desc meteo</h5>
          <img src="images/missing_image.png" alt="missing image" class="card-img-top">
          <p class="mb-0">temp - temp percepita</p>
          <p class="mb-0">umidità - pressione</p>
          <p>vento - visibilità</p>
        </div>
     */
    const hourly_card = document.getElementById('today-weather');

    if (hourly_card.children.length == 0) {// se è la prima volta sulla pagina genero l'html
        for (let i = 0; i < 24; i++) {
            //console.log(hourly[i]);
            const data = timestampToDate(hourly[i].dt, result.timezone_offset);

            const info_container = document.createElement('div');
            const image_hourly = document.createElement('img');
            const info_title = document.createElement('h5');
            const info1 = document.createElement('p');
            const info2 = document.createElement('p');
            const info3 = document.createElement('p');
            const rain = document.createElement('img');
            const pressure = document.createElement('img');
            const humidity = document.createElement('img');
            const wind = document.createElement('img');

            rain.src = 'images/rain.png';
            rain.alt = 'probabilità di precipitazione';
            rain.className = 'icon';
            pressure.src = 'images/pressure.png';
            pressure.alt = 'pressione';
            pressure.className = 'icon';
            humidity.src = 'images/humidity.png';
            humidity.alt = 'umidità';
            humidity.className = 'icon';
            wind.src = 'images/wind.png';
            wind.alt = 'vento';
            wind.className = 'icon';

            const pop = document.createTextNode(' ' + Math.round(hourly[i].pop * 100) + '%   ');
            const uv = document.createTextNode('UV: ' + Math.trunc(hourly[i].uvi) + ' di 10    ');
            const vento = document.createTextNode(' ' + hourly[i].wind_speed + 'm/s ' + degToCompass(result.current.wind_deg));

            const umidità = document.createTextNode(hourly[i].humidity + '%   ');
            const pressione = document.createTextNode(hourly[i].pressure + 'hPa');

            if (i == 23) {
                info_container.className = 'col-xl-3';
            } else {
                info_container.className = 'col-xl-3 border border-top-0 border-start-0 border-bottom-0 border-2';
            }
            info_container.id = 'ora' + i;
            image_hourly.className = 'card-img-top';
            info1.className = 'mb-0';
            info2.className = 'mb-0';

            info_title.innerText = data.toLocaleTimeString(undefined, { month: "numeric", day: 'numeric', hour: '2-digit', minute: '2-digit' }) + ' - ' + hourly[i].weather[0].description;
            image_hourly.src = "https://openweathermap.org/img/wn/" + hourly[i].weather[0].icon + "@2x.png";;
            image_hourly.alt = hourly[i].weather[0].description;
            info1.innerText = Math.round(hourly[i].feels_like) + '°C';
            info2.append(rain, pop, uv, wind, vento);               //info2.innerText = 'pioggia: ' + hourly[i].pop + '%     UV: ' + Math.trunc(hourly[i].uvi) + "     " + hourly[i].wind_speed + 'm/s ' + degToCompass(result.current.wind_deg);
            info3.append(humidity, umidità, pressure, pressione);   //info3.innerText = 'umidità: ' + hourly[i].humidity + '%   ' + hourly[i].pressure + 'hPa';

            hourly_card.appendChild(info_container);
            info_container.append(info_title, image_hourly, info1, info2, info3);

            if (i == 23) {
                break;
            }
        }
    } else { // se l'html è già stato generato, aggiorno le informazioni
        for (let i = 0; i < 24; i++) {
            const data = timestampToDate(hourly[i].dt, result.timezone_offset);

            const ora = document.getElementById("ora" + i).children;
            ora[0].innerText = data.toLocaleTimeString(undefined, { month: "numeric", day: 'numeric', hour: '2-digit', minute: '2-digit' }) + ' - ' + hourly[i].weather[0].description;
            ora[1].src = "https://openweathermap.org/img/wn/" + hourly[i].weather[0].icon + "@2x.png";;
            ora[1].alt = hourly[i].weather[0].description;
            ora[2].innerText = Math.round(hourly[i].temp) + '°C - ' + Math.round(hourly[i].feels_like) + '°C';
            ora[3].innerText = 'prob: ' + Math.round(hourly[i].pop * 100) + '%   ' + hourly[i].wind_speed + 'm/s ' + degToCompass(result.current.wind_deg) + ' UV: ' + (hourly[i].uvi * 100).toFixed(0);
            ora[4].innerText = 'umidità: ' + hourly[i].humidity + '%   ' + hourly[i].pressure + 'hPa';
        }
    }
}

function dailyWeather(result, daily_weather) {
    // daily weather
    for (let i = 1; i < daily_weather.length; i++) {
        //data
        document.getElementById("g" + i).innerText = timestampToDate(daily_weather[i].dt, result.timezone_offset).toLocaleDateString(undefined, { weekday: 'long', month: 'long', day: 'numeric' });

        let day_card = document.getElementById("giorno" + i).children;
        day_card = day_card[0].getElementsByTagName("DIV");
        //giornata
        let info = day_card[0].getElementsByTagName("p");
        info[0].innerText = daily_weather[i].weather[0].description;
        info[1].innerText = "Max: " + Math.round(daily_weather[i].temp.max) + "°C \t Min: " + Math.round(daily_weather[i].temp.min) + "°C";
        info[2].innerText = "Precipitazioni: " + Math.round(daily_weather[i].pop * 100) + "% \t Vento: " + daily_weather[i].wind_speed + "m/s " + degToCompass(result.current.wind_deg);
        info[3].innerText = daily_weather[i].pressure + "hPa \t Umidità: " + daily_weather[i].humidity + "% \t UV: " + daily_weather[i].uvi;
        let image = day_card[0].getElementsByTagName("img");
        image[0].src = "https://openweathermap.org/img/wn/" + daily_weather[i].weather[0].icon + "@2x.png";
        image[0].alt = daily_weather[i].weather[0].description;
        //mattina
        info = day_card[1].getElementsByTagName("p");
        info[0].innerText = Math.round(daily_weather[i].feels_like.morn) + "°C";
        //pomeriggio
        info = day_card[2].getElementsByTagName("p");
        info[0].innerText = Math.round(daily_weather[i].feels_like.day) + "°C";
        //sera
        info = day_card[3].getElementsByTagName("p");
        info[0].innerText = Math.round(daily_weather[i].feels_like.eve) + "°C";
        //notte
        info = day_card[4].getElementsByTagName("p");
        info[0].innerText = Math.round(daily_weather[i].feels_like.night) + "°C";
    }
}