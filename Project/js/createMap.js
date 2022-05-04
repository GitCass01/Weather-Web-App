function initializeMap(lat, lon) {
    const map = L.map('map').setView([45.4221000, 9.108610], 8);
    var marker = L.marker([45.4221000, 9.108610]).addTo(map);

    const attribution = 'Map Data &copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>, Weather Data &copy; <a href="https://www.openweathermap.org">OpenWeatherMap</a> contributors, &copy; <a href="https://carto.com/attribution">CARTO</a>';

    const osmUrl = 'https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png';
    const osmTiles = L.tileLayer(osmUrl, { attribution});

    const owmUrl = 'https://tile.openweathermap.org/map/precipitation_new/{z}/{x}/{y}.png?appid=fb1d036e9880437a98ec66f6e4daab01';
    const owmTiles = L.tileLayer(owmUrl, { attribution });

    osmTiles.addTo(map);
    owmTiles.addTo(map);
}

function lon2tile(lon, zoom) {
    return (Math.floor((lon + 180) / 360 * Math.pow(2, zoom)));
}
function lat2tile(lat, zoom) {
    return (Math.floor((1 - Math.log(Math.tan(lat * Math.PI / 180) + 1 / Math.cos(lat * Math.PI / 180)) / Math.PI) / 2 * Math.pow(2, zoom)));
}