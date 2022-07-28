import pino from 'pino'

const logger = pino(pino.destination({
  minLength: 1024,
  sync: false
}))
logger.info('Logger initialized.')

export default logger
