//toggle dark mode
function toggleDarkMode() {
    const badge = document.querySelectorAll('.badge');
    if (document.getElementById('toggle-mode').checked == false) {
        document.getElementById('css-light').disabled = false;
        document.getElementById('css-dark').disabled = true;
        for (let i = 0; i < badge.length; i++) {
            badge[i].classList.remove('dark-alert');
            badge[i].classList.add('custom-alert');
        }
        localStorage.setItem('toggle-mode', JSON.stringify({ 'darkMode': '', 'date': new Date().getTime() }));
    } else {
        document.getElementById('css-light').disabled = true;
        document.getElementById('css-dark').disabled = false;
        for (let i = 0; i < badge.length; i++) {
            badge[i].classList.remove('custom-alert');
            badge[i].classList.add('dark-alert');
        }
        localStorage.setItem('toggle-mode', JSON.stringify({ 'darkMode': 'checked', 'date': new Date().getTime() }));
    }
}

function checkDarkMode() {
    const badge = document.querySelectorAll('.badge');
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
            for (let i = 0; i < badge.length; i++) {
                badge[i].classList.remove('custom-alert');
                badge[i].classList.add('dark-alert');
            }

        } else {
            document.getElementById('css-light').disabled = false;
            document.getElementById('css-dark').disabled = true;
            for (let i = 0; i < badge.length; i++) {
                badge[i].classList.remove('dark-alert');
                badge[i].classList.add('custom-alert');
            }

        }
    }
}

var searchBox = document.getElementById("floatingInput");
searchBox.addEventListener("keypress", function (event) {
    if (event.key === "Enter") {
        event.preventDefault();
        document.getElementById("searchBtn").click();
    }
});

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

// funzione che converte da gradi (0-360-720-...) in 'bussola' (N, O, S, E, ...)
// spiegazione: https://stackoverflow.com/a/7490772
function degToCompass(gradi) {
    let val = ((gradi / 22.5) + 0.5);
    val = Math.trunc(val);   // tronco 'val' senza arrotondare
    const compassValues = ['N', 'NNE', 'NE', 'ENE', 'E', 'ESE', 'SE', 'SSE', 'S', 'SSO', 'SO', 'OSO', 'O', 'ONO', 'NO', 'NNO'];
    return new String(compassValues[val % 16]);
}

// conversione da timestamp Unix, UTC in data
function timestampToDate(timestamp, offset) {
    const tz = new Date('August 19, 1975 23:15:30').getTimezoneOffset() * 60;
    // multiplied by 1000 so that the argument is in milliseconds, not seconds.
    var date = new Date((timestamp + offset + tz) * 1000);

    return date;
}

// dà la possibilità all'utente di scegliere la città da un 'suggestion box' rispetto allo 'state' e alla latitudine e longitudine
// in quanto la ricerca per nome introduce ambiguità
async function suggestion(id_suggestion) {
    const city = document.getElementById('floatingInput').value;

    const ul = document.getElementById(id_suggestion);
    ul.style.display = 'block';

    const ulChildren = ul.children;
    const numChildren = ulChildren.length;
    for (let i = 0; i < numChildren; i++) {
        const child = document.getElementById(i);
        ul.removeChild(child);
    }

    await fetch('/geo', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify({ 'city': city }),
    })
        .then(response => response.json())
        .then(result => {
            //console.log(result);
            let arr = [];
            if (result[0]) {
                for (let i = 0; i < result.length; i++) {
                    const li = document.createElement('li');
                    li.id = i;
                    if (result[i].local_names && result[i].local_names.it) {
                        li.innerText = result[i].local_names.it + ", " + result[i].country;
                    } else {
                        li.innerText = result[i].name + ", " + result[i].country;
                    }
                    if (result[i].state) {
                        li.innerText += " : " + result[i].state;
                    }
                    li.setAttribute('onclick', 'select(this)');
                    ul.append(li);
                    const obj = { 'name': li.innerText, lat: result[i].lat, 'lon': result[i].lon };
                    arr.push(obj);
                }
                sessionStorage.setItem('suggestions', JSON.stringify(arr));
            } else {
                alert('Città non trovata!')
            }
        })
        .catch(err => console.log("err: ", err));
}

function select(e) {
    document.getElementById('floatingInput').value = e.innerText;
    const obj = JSON.parse(sessionStorage.getItem('suggestions'));
    const lat = obj[e.id].lat;
    const lon = obj[e.id].lon;
    const fullName = document.getElementById('floatingInput').value;

    const ulId = e.parentNode.id;
    const ul = document.getElementById(ulId);
    const ulChildren = ul.children;
    const numChildren = ulChildren.length
    for (let i = 0; i < numChildren; i++) {
        const child = document.getElementById(i);
        ul.removeChild(child);
    }
    ul.style.display = 'none';
    sessionStorage.removeItem('suggestions');
    localStorage.setItem('cityWeekly', JSON.stringify(obj[e.id]));

    if (ulId === 'indexSuggestion') {
        showMe(lat, lon, fullName);
    } else if (ulId === 'weeklySuggestion') {
        weeklyWeather();
    }
}

function createAlertModal(id_card, alerts) {
    /* come deve venire il modal di bootstrap in HTML:
    
        <div id="alert" class="badge rounded-pill text-dark" data-bs-toggle="modal" data-bs-target="#alertPopUp"></div>

        <div class="modal fade" id="alertPopUp" tabindex="-1" aria-labelledby="alertPopUpLabel" aria-hidden="true">
            <div class="modal-dialog">
                <div class="modal-content">
                    <div class="modal-header">
                        <h5 class="modal-title" id="alertPopUpLabel">Allerte Meteo</h5>
                        <button type="button" class="btn-close" data-bs-dismiss="modal" aria-label="Close"></button>
                    </div>
                    <div class="modal-body">
                        Allerta 1 ('event')
                        'sender_name'
                        descrizione
                        ...
                        Allerta n ('event')
                        'sender_name'
                        descrizione
                    </div>
                    <div class="modal-footer">
                        <button type="button" class="btn btn-secondary" data-bs-dismiss="modal">Close</button>
                    </div>
                </div>
            </div>
        </div>
    */
    // creo gli elementi che costituiscono il modal
    const modal = document.createElement('div');
    const modalDialog = document.createElement('div');
    const modalContent = document.createElement('div');
    const modalHeader = document.createElement('div');
    const title = document.createElement('h5');
    const button = document.createElement('button');
    const modalBody = document.createElement('div');
    const modalFooter = document.createElement('div');
    const button1 = document.createElement('button');
    // inserisco classi, id e attributi agli elementi
    modal.className = 'modal fade';
    modal.id = 'alertPopUp-' + id_card;
    modal.setAttribute('tabindex', '-1');
    modal.setAttribute('aria-labelledby', 'alertPopUpLabel-' + id_card);
    modal.setAttribute('aria-hidden', 'true');
    modalDialog.className = 'modal-dialog modal-dialog-centered modal-dialog-scrollable';
    modalContent.className = 'modal-content';
    modalHeader.className = 'modal-header';
    title.className = 'modal-title';
    title.id = 'alertPopUpLabel-' + id_card;
    button.className = 'btn-close';
    button.setAttribute('type', 'button');
    button.setAttribute('data-bs-dismiss', 'modal');
    button.setAttribute('aria-label', 'Close');
    modalBody.className = 'modal-body';
    modalFooter.className = 'modal-footer';
    button1.className = 'btn btn-secondary';
    button1.type = 'button';
    button1.setAttribute('data-bs-dismiss', 'modal');
    // inserisco le informazioni
    title.innerText = 'Allerte Meteo';
    button1.innerText = 'Close';
    const allerte = [];
    for (let i = 0; i < alerts.length; i++) {
        const description = document.createElement('div');
        const description1 = document.createElement('p');
        const bold = document.createElement('strong');
        const description2 = document.createElement('p');
        const italic = document.createElement('i');
        const description3 = document.createElement('p');

        bold.innerText = alerts[i].event + "\n";
        italic.innerText = alerts[i].sender_name + "\n"
        description3.innerText += alerts[i].description + "\n";

        description1.append(bold);
        description2.append(italic);
        description.append(description1, description2, description3);
        allerte.push(description);
    }
    // lo inserisco nella pagina
    const main = document.getElementById('main');
    main.appendChild(modal);
    modal.appendChild(modalDialog);
    modalDialog.appendChild(modalContent);
    modalContent.append(modalHeader, modalBody, modalFooter);
    modalHeader.append(title, button);
    for (let i = 0; i < allerte.length; i++) {
        modalBody.append(allerte[i]);
        if (i < allerte.length - 1) {
            const divider = document.createElement('hr');
            modalBody.append(divider);
        }
    }
    modalFooter.append(button1);
}