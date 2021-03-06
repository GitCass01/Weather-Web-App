# Weather-Web-App
Weather web application project for the "Tecnologie e Linguaggi per il Web" course at Unimi - year 2021/2022

## Setup
Nella cartella del progetto troverai un file *package.json* che conterrà varie informazioni e le *'dependencies'*, ovvero i moduli node.js usati per il progetto.

Per scaricare questi moduli portati nell cartella digita *'node install'* in una console portandoti nella cartella del progetto scaricato.

## Database
* Salvataggio Dati
Ad ogni ricerca di una città *non salvata* nei database verranno acquisiti i dati relativi e salvati in **weatherData.json**. 
Verranno inoltre generati e salvati i dati relativi ai grafici delle temperature/piogge, **chartRains.json** **chartTemperatures.json** se ci troviamo per la prima volta nella pagina *weather.html* con quella città.

* Aggiornamento Dati (tramite **worker_threads** e **weatherDataWorker.js**)
Ad ogni avvio del server (node server.js) verranno aggiornati i dati di tutte le città salvate in *weatherData.json* e i corrispettivi dati dei grafici (*chartRains.json* e *chartTemperatures.json*) **SOLO SE** la data di salvataggio di quei dati è di almeno 1gg prima. Questo controllo è necessario in quanto se il server è stato "spento" per più di un giorno i dati non saranno aggiornati ad oggi.

* Una volta che il server è attivo, tramite il modulo **node-schedule**, il db *weatherData.json*(meteo corrente, orario e giornaliero), *chartRains.json* e *chartTemperatures.json*  verranno aggiornati ogni giorno alle 00:30.
* Inoltre la entry *current* nel db *weatherData.json* verrà aggiornata ogni 10 minuti, grazie alla funzione *setInterval* di js, in quanto i dati del *meteo corrente* vengono aggiornati ogni 10 minuti da *openweathermap* stesso come scritto nella loro [guida](https://openweathermap.org/guide).

## Note per cambiare frequenza di aggiornamento dei database
1. Per cambiare frequenza di aggiornamento dei db tramite node-schedule basta cambiare il seguente codice nel file *weatherDataWorker.js*:
```javascript
const jobWeather = schedule.scheduleJob('30 0 * * *', updateWeatherData);
```
per maggiori informazioni sulla sintassi consulta la guida di [node-schedule](https://www.npmjs.com/package/node-schedule).
2. Per cambiare la frequenza della entry del meteo corrente basta camviare il seguente codice nel file *weatherDataWorker.js*:
```javascript
var intervalId = setInterval(updateCurrentWeatherData, 600000);
```
dove 600000 sono i *millisecondi* corrispondenti a 10 minuti.

## dotenv
Troverai un file chiamato *'.env_sample'* dove dovrai inserire le varie informazioni sensibili e private (come l'api key di [openweathermap](https://openweathermap.org/api)), successivamente rinomina il file come *'.env'*.
Nel file *.env_sample* troverai altre 2 variabili che indicheranno lo username e la password del tuo provider di email (**IMPORTANTE** il codice presente in *server.js* è configurato per funzionare con *gmail* e con dei requisiti che potrai leggere nella sezione [Risoluzione Problemi](#Risoluzione-problemi)).

## Avvio server
Basterà portarsi nella cartella del progetto e digitare *'node server.js'*, aprire un browser e digitare l'url *'localhost:3000'*

## Risoluzione Problemi
* Invio mail con il modulo 'nodemailer' (*gmail*)
  1. Se viene stampato in console un errore (riconoscibile dal colore rosso) di *self signed certificate*, prova a disabilitare il tuo antivirus (es. avast)
  2. Ora se nella console viene stampato un errore di autenticazione (username e pw errati), dovrai andare al seguente [link](https://www.google.com/settings/security/lesssecureapps) e abilitare l'opzione visualizzata.
  3. Se l'errore persiste, all'interno di *server.js*, dovrai decommentare la seguente porzione di codice: 
  ```javascript
    tls: {
        rejectUnauthorized: false // oppure controllare antivirus causa problema
    }
  ```
  4. al seguente [link](https://nodemailer.com/usage/using-gmail/) potrai trovare più informazioni su come usare *gmail* con *nodemailer*
  
* Invio mail con altri servizi differenti da gmail (*es. custom smtp*)
  1. al seguente [link](https://nodemailer.com/smtp/) potrai vedere come modificare il codice presente in *server.js* per renderlo compatibile con un servizio smtp qualsiasi
  2. al seguente [link](https://nodemailer.com/transports/), invece troverai altri metodi per inviare mail tramite *nodemailer*
