// shadow on mouse hover per le card - JQuery
$(document).ready(function () {
  $(".card").hover(
    function () {
      $(this).addClass("shadow");
    },
    function () {
      $(this).removeClass("shadow");
    }
  );
});

//toggle dark mode
function toggleDarkMode() {
  if (document.getElementById('toggle-mode').checked == false) {
    document.getElementById('css-light').disabled = false;
    document.getElementById('css-dark').disabled = true;
    $(document).ready(function () {
      $(".badge").removeClass("dark-alert");
      $(".badge").addClass("custom-alert");
    })
    sessionStorage.setItem('toggle-mode', '');
  } else {
    document.getElementById('css-light').disabled = true;
    document.getElementById('css-dark').disabled = false;
    $(document).ready(function () {
      $(".badge").removeClass("custom-alert");
      $(".badge").addClass("dark-alert");
    })
    sessionStorage.setItem('toggle-mode', 'checked');
  }
}

function checkDarkMode() {
  if (sessionStorage.getItem('toggle-mode').localeCompare('checked') == 0) {
    document.getElementById('css-light').disabled = true;
    document.getElementById('css-dark').disabled = false;
    document.getElementById('toggle-mode').setAttribute('checked', 'true');
    $(document).ready(function () {
      $(".badge").removeClass("custom-alert");
      $(".badge").addClass("dark-alert");
    })
  }
}

// geolocalizzazione (+ reverse geocoding)
function getLocation() {
  if (navigator.geolocation) {
    navigator.geolocation.getCurrentPosition(showPosition, errorFunction);
  } else {
    alert("Geolocation is not supported by this browser.");
  }
}

function showPosition(position) {
  const latitude = position.coords.latitude;
  const longitude = position.coords.longitude;

  const BASE_URL = 'https://nominatim.openstreetmap.org/reverse?';
  const params = {
    lat: latitude,
    lon: longitude,
    format: 'json',
  };

  const query = new URLSearchParams(params).toString();
  const final_url = BASE_URL + query + "&accept-language=it"

  fetch(final_url)
    .then((response) => response.json())
    .then((result) => {
      //console.log(result);

      let city_name;
      if (result['address']['town']) {
        city_name = result['address']['town'];
      } else {
        city_name = result['address']['city'];
      }

      const country = result['address']['country_code'].toUpperCase();

      document.getElementById('floatingInput').value = city_name + ", " + country;
    })
    .catch((err) => console.log("err: ", err));
}

function errorFunction() {
  alert("Geocoder failed");
}

// conversione da timestamp Unix, UTC in "gg/mm/aaaa"
function timestampToDate(timestamp, offset) {
  const tz = new Date('August 19, 1975 23:15:30').getTimezoneOffset() * 60;
  // multiplied by 1000 so that the argument is in milliseconds, not seconds.
  var date = new Date((timestamp + offset + tz) * 1000);

  return date;
}

// funzione per mostrare la card specifica per la città innserita nella search bar + current weather
async function showMe() {
  let card = document.getElementById('hidden-card');
  let city = document.getElementById('floatingInput');

  if (city.value.trim()) {
    const latLon = await getLatLon(city.value);

    if (latLon[2] == 1) {
      alert("Città non trovata!");
    } else {
      card.style.display = 'block';
      document.getElementById('city').innerText = city.value;
      setWeather(latLon[0], latLon[1], 'hidden-card-body');
    }
  }
}

// CURRENT WEATHER (card in homepage: Milano, Londra, Tokyo, New York)
// direct geocoding call : http://api.openweathermap.org/geo/1.0/direct?q=Milano&limit=3&appid=fb1d036e9880437a98ec66f6e4daab01
// one call api : https://api.openweathermap.org/data/2.5/onecall?lat=xxxx&lon=xxxx&exclude=minutely,hourly,daily&appid=fb1d036e9880437a98ec66f6e4daab01
async function currentWeatherHomePage() {
  let latLon = await getLatLon('Milano, IT');
  setWeather(latLon[0], latLon[1], 'card-milano');
  latLon = await getLatLon('Londra, GB');
  setWeather(latLon[0], latLon[1], 'card-londra');
  latLon = await getLatLon('Tokyo, JP');
  setWeather(latLon[0], latLon[1], 'card-tokyo');
  latLon = await getLatLon('New York, US');
  setWeather(latLon[0], latLon[1], 'card-newyork');
}

//funzione per la ricerca di 'latitudine, longitudine' dato il nome di una città
async function getLatLon(city) {
  const geo_url = 'https://api.openweathermap.org/geo/1.0/direct?';
  const params = {
    q: city,
    limit: 5,
    appid: 'fb1d036e9880437a98ec66f6e4daab01'
  };
  const query = new URLSearchParams(params).toString().replace("%2C", ",");
  const final_url = geo_url + query;

  let lat = 0;
  let lon = 0;
  let err = 0

  await fetch(final_url)
    .then(response => response.json())
    .then(result => {
      //console.log(result);
      if (result[0]) {
        lat = result[0].lat;
        lon = result[0].lon;
      } else {
        err = 1;
      }
    })
    .catch(err => console.log("err: ", err));

  return [lat, lon, err];
}

// funzione per la ricerca e l'inserimento del meteo nelle card
function setWeather(lat, lon, id_card) {
  const onecall_url = 'https://api.openweathermap.org/data/2.5/onecall?';
  const params = {
    lat: lat,
    lon: lon,
    exclude: 'minutely,hourly,daily',
    units: 'metric',
    lang: 'it',
    appid: 'fb1d036e9880437a98ec66f6e4daab01'
  }
  const query_weather = new URLSearchParams(params).toString().replaceAll("%2C", ",");
  const call = onecall_url + query_weather;

  fetch(call)
    .then(response => response.json())
    .then(result => {
      //console.log(result);
      let citycard = document.getElementById(id_card).children;

      citycard[0].innerText = timestampToDate(result.current.dt, result.timezone_offset).toLocaleString();
      citycard[1].src = "https://openweathermap.org/img/wn/" + result.current.weather[0].icon + "@2x.png";
      citycard[1].alt = result.current.weather[0].description;
      citycard[2].innerText = Math.round(result.current.temp) + "° " + result.current.weather[0].description;
      if (result.alerts) {
        citycard[3].style.display = 'block';
        //console.log(result.alerts);
        citycard[3].innerText = result.alerts[0].event;
        citycard[3].classList.add("custom-alert");
      }
      const lis = citycard[4].getElementsByTagName("li");
      lis[0].innerText = "Umidità: " + result.current.humidity + "%";
      lis[1].innerText = "Pressione: " + result.current.pressure + " hPa";
      lis[2].innerText = "Vento: " + result.current.wind_speed + " m/s";
    })
    .catch(err => console.log("err: ", err));
}

// weekly (7 days) weather for 'weather.html' page
function weeklyWeather() {
  // lat, lon got from client
  let lat = 45.4221000;
  let lon = 9.108610;

  const onecall_url = 'https://api.openweathermap.org/data/2.5/onecall?';
  const params = {
    lat: lat,
    lon: lon,
    exclude: 'minutely',
    units: 'metric',
    lang: 'it',
    appid: 'fb1d036e9880437a98ec66f6e4daab01'
  }
  const query_weather = new URLSearchParams(params).toString().replaceAll("%2C", ",");
  const call = onecall_url + query_weather;

  fetch(call)
    .then(response => response.json())
    .then(result => {
      //console.log(result);
      const current_weather = result.current;
      const daily_weather = result.daily;
      const hourly = result.hourly;
      console.log(result);

      //current weather
      const current_card = document.getElementById('current-weather').children;
      current_card[0].innerText = timestampToDate(current_weather.dt, result.timezone_offset).toLocaleString();
      current_card[1].src = "https://openweathermap.org/img/wn/" + current_weather.weather[0].icon + "@2x.png";
      current_card[1].alt = current_weather.weather[0].description;
      current_card[2].innerText = current_weather.weather[0].description;
      if (result.alerts) {
        current_card[3].style.display = 'block';
        current_card[3].innerText = result.alerts[0].event;
        current_card[3].classList.add("custom-alert");
      }
      const lis = current_card[4].getElementsByTagName("li");
      lis[0].innerText = "Umidità: " + current_weather.humidity + "%";
      lis[1].innerText = "Pressione: " + current_weather.pressure + " hPa";
      lis[2].innerText = "Vento: " + current_weather.wind_speed + " m/s";

      //hourly weather: fino alle 23:00
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

      for (let i = 0; i < 24; i++) {
        // prendo le informazioni dal risultato della chiamata
        const data = timestampToDate(hourly[i].dt, result.timezone_offset);

        // genero l'html
        const info_container = document.createElement('div');
        const image_hourly = document.createElement('img');
        const info_title = document.createElement('h5');
        const info1 = document.createElement('p');
        const info2 = document.createElement('p');
        const info3 = document.createElement('p');

        if (data.getHours() == 23 || i == 23) {
          info_container.className = 'col-md-3';
        } else {
          info_container.className = 'col-md-3 border border-top-0 border-start-0 border-bottom-0 border-2';
        }
        image_hourly.className = 'card-img-top';
        info1.className = 'mb-0';
        info2.className = 'mb-0';

        info_title.innerText = data.toLocaleTimeString(undefined, { hour: '2-digit', minute: '2-digit' }) + ' - ' + hourly[i].weather[0].description;
        image_hourly.src = "https://openweathermap.org/img/wn/" + hourly[i].weather[0].icon + "@2x.png";;
        image_hourly.alt = hourly[i].weather[0].description;
        info1.innerText = hourly[i].temp + '°C - ' + hourly[i].feels_like + '°C';
        info2.innerText = 'prob: ' + hourly[i].pop + '%   ' + hourly[i].wind_speed + 'm/s   UV: ' + (hourly[i].uvi*100);
        info3.innerText = 'umidità: ' + hourly[i].humidity + '%   ' + hourly[i].pressure + 'hPa';

        hourly_card.appendChild(info_container);
        info_container.append(info_title, image_hourly, info1, info2, info3);

        if (data.getHours() == 23 || i == 23) {
          break;
        }
      }

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
        info[2].innerText = "Precipitazioni: " + daily_weather[i].pop * 100 + "% \t Vento: " + daily_weather[i].wind_speed + "m/s";
        info[3].innerText = daily_weather[i].pressure + "hPa \t Umidità: " + daily_weather[i].humidity + "% \t UV: " + daily_weather[i].uvi;
        let image = day_card[0].getElementsByTagName("img");
        image[0].src = "https://openweathermap.org/img/wn/" + daily_weather[i].weather[0].icon + "@2x.png";
        image[0].alt = daily_weather[i].weather[0].description;
        //mattina
        info = day_card[1].getElementsByTagName("p");
        info[0].innerText = Math.round(daily_weather[i].temp.morn) + "°C";
        info[1].innerText = Math.round(daily_weather[i].feels_like.morn) + "°C";
        //pomeriggio
        info = day_card[2].getElementsByTagName("p");
        info[0].innerText = Math.round(daily_weather[i].temp.day) + "°C";
        info[1].innerText = Math.round(daily_weather[i].feels_like.day) + "°C";
        //sera
        info = day_card[3].getElementsByTagName("p");
        info[0].innerText = Math.round(daily_weather[i].temp.eve) + "°C";
        info[1].innerText = Math.round(daily_weather[i].feels_like.eve) + "°C";
        //notte
        info = day_card[4].getElementsByTagName("p");
        info[0].innerText = Math.round(daily_weather[i].temp.night) + "°C";
        info[1].innerText = Math.round(daily_weather[i].feels_like.night) + "°C";
      }
    })
    .catch(err => console.log("err: ", err));
}

// historical weather (5 days)