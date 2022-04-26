// funzione per mostrare la card specifica per la città innserita nella search bar
function showMe() {
  var card = document.getElementById('hidden-card');
  var city = document.getElementById('floatingInput');

  if (city.value.trim()) {
    if (card.style.display == '' || card.style.display == 'none') {
      card.style.display = 'block';
      document.getElementById('city').innerHTML = city.value;
    }
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

// geolocalizzazione
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