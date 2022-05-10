function initializeMap(lat, lon) {
    //document.getElementById('weatherMap').innerHTML = "<div id='map' class='my-3'></div>"; --> non sicuro
    // soluzione
    if (document.getElementById('weatherMap').children.length == 1) {
        //console.log('cancello la vecchia mappa...');
        document.getElementById('weatherMap').children[0].remove();
    }
    const mapContainer = document.getElementById('weatherMap');
    const mappa = document.createElement('div');
    mappa.className = 'my-3';
    mappa.id = 'map';
    mapContainer.appendChild(mappa);

    const map = L.map('map').setView([lat, lon], 9);
    var marker = L.marker([lat, lon]).addTo(map);

    const attribution = 'Map Data &copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>, Weather Data &copy; <a href="https://www.openweathermap.org">OpenWeatherMap</a> contributors, &copy; <a href="https://carto.com/attribution">CARTO</a>';

    //https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png --> use it for dark mode
    const osmUrl = 'https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png';
    const osmTiles = L.tileLayer(osmUrl, { transparency: true, opacity: '1', attribution});

    const owmUrl = 'https://tile.openweathermap.org/map/precipitation_new/{z}/{x}/{y}.png?appid=fb1d036e9880437a98ec66f6e4daab01';
    const owmTiles = L.tileLayer(owmUrl, { attribution });

    osmTiles.addTo(map);
    owmTiles.addTo(map);
}