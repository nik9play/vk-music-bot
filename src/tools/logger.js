if (process.env.NODE_ENV == 'development') require('dotenv').config()

import { createLogger, transports, format } from 'winston'
// import LogzioWinstonTransport from 'winston-logzio'
import mongotr from 'winston-mongodb'

const { combine } = format

// const logzioWinstonTransport = new LogzioWinstonTransport({
//   level: 'info',
//   name: 'winston_logzio',
//   token: process.env.LOGZIO_TOKEN,
//   host: 'listener-eu.logz.io',
// })

const mongoTransport = new mongotr.MongoDB({
  level: 'info',
  db: process.env.MONGO_URL,
  options: {
    useUnifiedTopology: true
  }
})

const logger = createLogger({
  format: combine(
    format.splat(),
    format.simple()
  ),
  transports: [new transports.Console(), mongoTransport],
})

export default logger
