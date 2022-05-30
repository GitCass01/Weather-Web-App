# Weather-Web-App
Weather web application project for the "Tecnologie e Linguaggi per il Web" course at Unimi - year 2021/2022

## Setup
Nella cartella del progetto troverai un file *package.json* che conterrà varie informazioni e le *'dependencies'*, ovvero i moduli node.js usati per il progetto.

Per scaricare questi moduli portati nell cartella digita *'node install'* in una console portandoti nella cartella del progetto scaricato.

## dotenv
Troverai un file chiamato *'.env_sample'* dove dovrai inserire le varie informazioni sensibili e private (come l'api key di [openweathermap](https://openweathermap.org/api)), successivamente rinomina il file come *'.env'*

## Avvio server
Basterà portarsi nella cartella del progetto e digitare *'node server.js'*, aprire un browser e digitare l'url *'localhost:3000'*

## Risoluzione Problemi
* Invio mail con il modulo 'nodemailer'
  1. Se viene stampato in console un errore (riconoscibile dal colore rosso) di *self signed certificate*, prova a disabilitare il tuo antivirus (es. avast)
  2. Ora se nella console viene stampato un errore di autenticazione (username e pw errati), dovrai andare al seguente [link](https://www.google.com/settings/security/lesssecureapps) e abilitare l'opzione visualizzata.
  3. Se l'errore persiste, all'interno di *server.js*, dovrai decommentare la seguente porzione di codice: 
  ```javascript
    tls: {
        rejectUnauthorized: false // oppure controllare antivirus causa problema
    }
  ```
