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
  } else {
    document.getElementById('css-light').disabled = true;
    document.getElementById('css-dark').disabled = false;
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
      console.log(result);

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

  return date.toLocaleString();
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
    limit: 3,
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

      citycard[0].innerText = timestampToDate(result.current.dt, result.timezone_offset);
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

// weekly (7 days) weather

// historical weather (5 days)