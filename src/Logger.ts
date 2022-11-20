import pino from 'pino'

const logger = pino(
  pino.destination({
    minLength: 256,
    sync: false
  })
)
logger.info('Logger initialized.')

export default logger
