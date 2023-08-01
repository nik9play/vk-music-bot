import pino from 'pino'
import cluster from 'cluster'
import type { LokiOptions } from 'pino-loki'

let transport

if (process.env.NODE_ENV === 'development') {
  transport = pino.transport({
    target: 'pino-pretty'
  })
} else {
  transport = pino.transport<LokiOptions>({
    target: 'pino-loki',
    options: {
      labels: { application: 'vkmusicbot' },
      batching: true,
      interval: 5,
      propsToLabels: ['msg', 'cluster_id', 'guild_id', 'shard_id'],
      host: process.env.LOKI_URL
    }
  })
}

const logger = pino(
  {
    level: process.env.NODE_ENV === 'development' ? 'debug' : 'info',
    formatters: {
      log: (obj) => ({
        cluster_id: cluster.isPrimary ? 'Master' : process.env.INDOMITABLE_CLUSTER,
        ...obj
      })
    }
  },
  transport
)
// logger.info('Logger initialized.')

export default logger
