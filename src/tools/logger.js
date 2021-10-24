import { createLogger, transports, format } from 'winston'
import LogzioWinstonTransport from 'winston-logzio'
const { combine } = format

const logzioWinstonTransport = new LogzioWinstonTransport({
  level: 'info',
  name: 'winston_logzio',
  token: process.env.LOGZIO_TOKEN,
  host: 'listener-eu.logz.io',
})

const logger = createLogger({
  format: combine(
    format.splat(),
    format.simple()
  ),
  transports: [new transports.Console(), logzioWinstonTransport],
})

export default logger
