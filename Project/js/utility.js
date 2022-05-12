

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

var searchBox = document.getElementById("floatingInput");
searchBox.addEventListener("keypress", function(event) {
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