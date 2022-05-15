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

    const attribution = 'Map Data &copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>, Weather Data &copy; <a href="https://www.openweathermap.org">OpenWeatherMap</a> contributors, &copy; <a href="https://carto.com/attribution">CARTO</a>';

    //https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png --> use it for dark mode
    let osmUrl;
    if (localStorage.getItem('toggle-mode')) {
        let obj = JSON.parse(localStorage.getItem('toggle-mode'));
        if (obj['darkMode'].localeCompare('checked') == 0) {
            osmUrl = 'https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png';
        } else {
            osmUrl = 'https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png';
        }
    } else {
        osmUrl = 'https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png';
    }

    const osmTiles = L.tileLayer(osmUrl, { transparency: true, opacity: '1', attribution });

    const owmRainsUrl = 'https://tile.openweathermap.org/map/precipitation_new/{z}/{x}/{y}.png?appid=' + API_KEY;
    const owmRainTiles = L.tileLayer(owmRainsUrl, { attribution });

    var marker = L.marker([lat, lon]).bindPopup(JSON.parse(localStorage.getItem('cityWeekly')).name);

    const map = L.map('map', { layers: [osmTiles, owmRainTiles, marker] }).setView([lat, lon], 9);

    var baseMaps = {
        "Piogge": owmRainTiles,
    };

    var overlayMaps = {
        "Posizione": marker
    };

    var layerControl = L.control.layers(baseMaps, overlayMaps).addTo(map);

    const owmTempUrl = 'https://tile.openweathermap.org/map/temp_new/{z}/{x}/{y}.png?appid=' + API_KEY;
    const owmTempTiles = L.tileLayer(owmTempUrl, { attribution });
    layerControl.addBaseLayer(owmTempTiles, 'Temperature');
}