// funzione per mostrare la card specifica per la città innserita nella search bar
// + current weather
// direct geocoding call : http://api.openweathermap.org/geo/1.0/direct?q=city&limit=3&appid=fb1d036e9880437a98ec66f6e4daab01
// one call api : https://api.openweathermap.org/data/2.5/onecall?lat=xxxx&lon=xxxx&exclude=minutely,hourly,daily&appid=fb1d036e9880437a98ec66f6e4daab01
// icon url : http://openweathermap.org/img/wn/xxx@2x.png
const icon_url = "http://openweathermap.org/img/wn/10d@2x.png";

function showMe() {
  let card = document.getElementById('hidden-card');
  let city = document.getElementById('floatingInput');

  if (city.value.trim()) {
    card.style.display = 'block';
    document.getElementById('city').innerHTML = city.value;

    const geo_url = 'http://api.openweathermap.org/geo/1.0/direct?';
    const params = {
      q: city.value,
      limit: 3,
      appid: 'fb1d036e9880437a98ec66f6e4daab01'
    };
    const query = new URLSearchParams(params).toString().replace("%2C", ",");
    const final_url = geo_url + query;

    fetch(final_url)
      .then(response => response.json())
      .then(result => {
        const lat = result[0].lat;
        const lon = result[0].lon;

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
            console.log(result);

            let citycard = document.getElementById('hidden-card-body').children;

            citycard[0].innerHTML = timestampToDate(result.current.dt);
            citycard[1].src += result.current.weather[0].icon + "@2x.png";
              citycard[2].innerHTML = result.current.temp + "° " + result.current.weather[0].description;
            if (result.alerts) {
              citycard[3].style.display = 'block';
              citycard[3].innerHTML = result.alerts.event;
              citycard[3].classList.add("bg-danger");
            }
            const lis = citycard[4].getElementsByTagName("li");
            lis[0].innerHTML += result.current.humidity + "%";
            lis[1].innerHTML += result.current.pressure + " hPa";
            lis[2].innerHTML += result.current.wind_speed + " m/s";

          })
          .catch(err => console.log("err: ", err));
      })
      .catch(err => console.log("err: ", err));
  }
}

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
  const final_url = BASE_URL + query;

  fetch(final_url)
    .then((response) => response.json())
    .then((result) => {
      console.log(result);

      const city_name = result['address']['town'];
      const country = result['address']['country_code'].toUpperCase();

      document.getElementById('floatingInput').value = city_name + ", " + country;
    })
    .catch((err) => console.log("err: ", err));
}

function errorFunction() {
  alert("Geocoder failed");
}

// conversione da timestamp Unix, UTC in "gg/mm/aaaa"
function timestampToDate(timestamp) {
  // multiplied by 1000 so that the argument is in milliseconds, not seconds.
  var date = new Date(timestamp * 1000);

  return date.toLocaleString('it-IT');
}

// CURRENT WEATHER (card in homepage: Milano, Londra, Tokyo, New York)
// direct geocoding call : http://api.openweathermap.org/geo/1.0/direct?q=Milano&limit=3&appid=fb1d036e9880437a98ec66f6e4daab01
// one call api : https://api.openweathermap.org/data/2.5/onecall?lat=xxxx&lon=xxxx&exclude=minutely,hourly,daily&appid=fb1d036e9880437a98ec66f6e4daab01



// weekly (7 days) weather

// historical weather (5 days)