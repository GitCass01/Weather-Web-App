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
        localStorage.setItem('toggle-mode', JSON.stringify({ 'darkMode': '', 'date': new Date().getTime() }));
    } else {
        document.getElementById('css-light').disabled = true;
        document.getElementById('css-dark').disabled = false;
        $(document).ready(function () {
            $(".badge").removeClass("custom-alert");
            $(".badge").addClass("dark-alert");
        })
        localStorage.setItem('toggle-mode', JSON.stringify({ 'darkMode': 'checked', 'date': new Date().getTime() }));
    }
}

function checkDarkMode() {
    if (localStorage.getItem('toggle-mode')) {
        let obj = JSON.parse(localStorage.getItem('toggle-mode'));

        // se la preferenza è stata data più di 7gg fa, resetto la preferenza
        const today_date = new Date().getTime();
        if ((today_date - obj['date']) / (1000 * 60 * 60 * 24) > 7) {
            localStorage.setItem('toggle-mode', JSON.stringify({ 'darkMode': '', 'date': new Date().getTime() }));
            obj = JSON.parse(localStorage.getItem('toggle-mode'));
        }

        if (obj['darkMode'].localeCompare('checked') == 0) {
            document.getElementById('css-light').disabled = true;
            document.getElementById('css-dark').disabled = false;
            document.getElementById('toggle-mode').setAttribute('checked', 'true');
            $(document).ready(function () {
                $(".badge").removeClass("custom-alert");
                $(".badge").addClass("dark-alert");
            })
        } else {
            document.getElementById('css-light').disabled = false;
            document.getElementById('css-dark').disabled = true;
            $(document).ready(function () {
                $(".badge").removeClass("dark-alert");
                $(".badge").addClass("custom-alert");
            })
        }
    }
}

// geolocation (+ reverse geocoding)
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

// conversione da timestamp Unix, UTC in data
function timestampToDate(timestamp, offset) {
    const tz = new Date('August 19, 1975 23:15:30').getTimezoneOffset() * 60;
    // multiplied by 1000 so that the argument is in milliseconds, not seconds.
    var date = new Date((timestamp + offset + tz) * 1000);

    return date;
}