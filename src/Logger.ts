import pino from 'pino'

let transport

if (process.env.NODE_ENV === 'development') {
  transport = pino.transport({
    target: 'pino-pretty'
  })
} else {
  transport = pino.destination({
    minLength: 256,
    sync: false
  })
}

const logger = pino(transport)
logger.info('Logger initialized.')

export default logger
