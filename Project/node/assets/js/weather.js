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
    generateChart();

    await fetch('/weatherData?city=' + name + '&lat=' + lat + '&lon=' + lon)
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

// genera il meteo per le 24 ore successive
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
        }
    } else { // se l'html è già stato generato, aggiorno le informazioni
        for (let i = 0; i < 24; i++) {
            const data = timestampToDate(hourly[i].dt, result.timezone_offset);


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

            const ora = document.getElementById("ora" + i).children;
            ora[0].innerText = data.toLocaleTimeString(undefined, { month: "numeric", day: 'numeric', hour: '2-digit', minute: '2-digit' }) + ' - ' + hourly[i].weather[0].description;
            ora[1].src = "https://openweathermap.org/img/wn/" + hourly[i].weather[0].icon + "@2x.png";;
            ora[1].alt = hourly[i].weather[0].description;
            ora[2].innerText = Math.round(hourly[i].feels_like) + '°C';
            ora[3].textContent = '';
            ora[4].textContent = '';
            ora[3].append(rain, pop, uv, wind, vento);
            ora[4].append(humidity, umidità, pressure, pressione);
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