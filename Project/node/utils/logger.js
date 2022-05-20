const winston = require('winston');

// definisco i vari livelli di importanza
const levels = {
    error: 0,
    warn: 1,
    info: 2,
    http: 3,
    debug: 4,
}

// debug = stampa tutti i messaggi essendo il livello più alto
const level = () => { return 'debug' }

// definisco vari colori per i diversi livelli
const colors = {
    error: 'red',
    warn: 'yellow',
    info: 'green',
    http: 'magenta',
    debug: 'white',
}
winston.addColors(colors)

// il formato del log
const format = winston.format.combine(
    // aggiunge il timestamp del log
    winston.format.timestamp({ format: 'DD-MM-YYYY HH:mm:ss' }),
    // dice di colorare i messaggi
    //winston.format.colorize({ all: true }), --> problema: nei file.log non colora ma stampa la codifica del colore
    // il formato del messaggio: timestamp - il livello del msg - il msg
    winston.format.printf(
        (info) => `${info.timestamp} ${info.level}: ${info.message}`,
    ),
)

// i transports che userà winston per stampare i messaggi
const transports = [
    // abilita la stampa in console
    new winston.transports.Console({
        format: winston.format.combine(
            winston.format.colorize({
                all: true
            }),
        )
    }),
    // abilita la stampa dei soli messaggi di errore in error.log
    new winston.transports.File({
        filename: 'utils/error.log',
        level: 'error',
    }),
    // abilita la stampa di tutti i messaggi in all.log
    new winston.transports.File({ filename: 'utils/all.log' }),
]

// creo il logger che sarà esportata e che verrà usato per stampare i log
const logger = winston.createLogger({
    level: level(),
    levels,
    format,
    transports,
})

module.exports = logger