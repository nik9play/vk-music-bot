import pino from 'pino'

import cluster from 'cluster'

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

const logger = pino(
  {
    level: process.env.NODE_ENV === 'development' ? 'debug' : 'info',
    formatters: {
      log: (obj) => ({ cluster_id: cluster.isPrimary ? 'Master' : process.env.CLUSTER, ...obj })
    }
  },
  transport
)
logger.info('Logger initialized.')

export default logger
