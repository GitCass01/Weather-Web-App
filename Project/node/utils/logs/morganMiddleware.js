const morgan = require("morgan");
const logger = require("./logger");

const stream = {
  // usa il livello 'http' del logger winston
  write: (message) => logger.http(message.trim()),  // sia winston che morgan aggiungono un 'new line' alla fine del msg, quindi uso trim()
};

const morganMiddleware = morgan(
  // definisco il formato del msg di log delle richieste http
  ":remote-addr :method :url :status :res[content-length] - :response-time ms",
  // definisco l'output stream
  { stream }
);

module.exports = morganMiddleware;