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

// geolocalizzazione
function getLocation() {
  if (navigator.geolocation) {
    navigator.geolocation.getCurrentPosition(showPosition, errorFunction);
  } else {
    alert("Geolocation is not supported by this browser.");
  }
}

function showPosition(position) {
  document.getElementById('floatingInput').value = "Latitude: " + position.coords.latitude + " Longitude: " + position.coords.longitude;
}

function errorFunction() {
  alert("Geocoder failed");
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