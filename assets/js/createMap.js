async function initializeMap(lat, lon) {
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

    // credits
    const attribution = 'Map Data &copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>, Weather Data &copy; <a href="https://www.openweathermap.org">OpenWeatherMap</a> contributors, &copy; <a href="https://carto.com/attribution">CARTO</a>';

    // layer URLs
    const darkURL = 'https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png';
    const lightURL = 'https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png';
    let owmRainsUrl = '';
    let owmTempUrl = '';

    // Soluzione per nascondere l'api key
    // chiedo l'url dei tiles di openweathermap al server nodejs
    await fetch('/getPrecipitationTiles?z={z}&x={x}&y={y}')
        .then(response => response.text())
        .then(result => {
            owmRainsUrl = result;
        })
        .catch(err => console.log("err: ", err));

    await fetch('/getTempTiles?z={z}&x={x}&y={y}')
        .then(response => response.text())
        .then(result => {
            owmTempUrl = result;
        })
        .catch(err => console.log("err: ", err));

    // layer tiles
    const osmDarkTiles = L.tileLayer(darkURL, { transparency: true, opacity: '1', attribution });
    const osmLightTiles = L.tileLayer(lightURL, { transparency: true, opacity: '1', attribution });
    const owmRainTiles = L.tileLayer(owmRainsUrl, { attribution });
    const owmTempTiles = L.tileLayer(owmTempUrl, { attribution });

    // current position marker
    var marker = L.marker([lat, lon]).bindPopup(JSON.parse(localStorage.getItem('cityWeekly')).name.split(" : ")[0]);

    // map config
    const map = L.map('map', { minZoom: 1, zoomSnap: 0.5 }).setView([lat, lon], 9);

    // layer controls
    var baseMaps = {
        "Piogge": owmRainTiles,
    };

    var overlayMaps = {
        "Posizione": marker
    };

    var layerControl = L.control.layers(baseMaps, overlayMaps).addTo(map);

    layerControl.addBaseLayer(owmTempTiles, 'Temperature');

    // 'openstreetmap' layer based on toggle-mode (dark/ligt mode)
    let osmTiles = osmLightTiles;
    if (localStorage.getItem('toggle-mode')) {
        let obj = JSON.parse(localStorage.getItem('toggle-mode'));
        if (obj['darkMode'].localeCompare('checked') == 0) {
            osmTiles = osmDarkTiles;
        }
    }
    osmTiles.addTo(map);
    owmRainTiles.addTo(map);
    marker.addTo(map);

    // creo i bounds per la mappa
    var southWest = L.latLng(-85.0511287798066, -185.62500000000003),
        northEast = L.latLng(84.92832092949963, 209.53125),
        bounds = L.latLngBounds(southWest, northEast);
    map.setMaxBounds(bounds);

    const toggle = document.getElementById('toggle-mode');
    toggle.addEventListener('click', (e) => {
        if (e.target.checked) {
            map.removeLayer(osmTiles);
            osmTiles = osmDarkTiles;
            osmTiles.addTo(map);
        } else {
            map.removeLayer(osmTiles);
            osmTiles = osmLightTiles;
            osmTiles.addTo(map);
        }
    });
}