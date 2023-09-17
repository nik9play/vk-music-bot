/* eslint-disable @typescript-eslint/ban-ts-comment */
import pino from 'pino'
import cluster from 'cluster'
// import type { LokiOptions } from 'pino-loki'
import { ENV } from './modules/env.js'

let transport

if (ENV.NODE_ENV === 'development') {
  transport = pino.transport({
    targets: [
      //@ts-ignore
      // {
      //   target: 'pino-loki',
      //   options: {
      //     labels: { application: 'vkmusicbot-dev' },
      //     batching: true,
      //     interval: 5,
      //     propsToLabels: ['msg', 'cluster_id', 'guild_id', 'shard_id', 'error_id'],
      //     host: ENV.LOKI_URL
      //   }
      // },
      //@ts-ignore
      {
        target: 'pino-pretty',
        level: 'debug'
      }
    ]
  })
} else {
  transport = pino.transport({
    targets: [
      //@ts-ignore
      {
        target: 'pino-loki',
        options: {
          labels: { application: 'vkmusicbot' },
          batching: true,
          interval: 5,
          propsToLabels: ['msg', 'cluster_id', 'guild_id', 'shard_id', 'error_id'],
          host: ENV.LOKI_URL
        }
      },
      //@ts-ignore
      {
        target: 'pino-pretty'
      }
    ]
  })
}

const logger = pino(
  {
    level: ENV.NODE_ENV === 'development' ? 'debug' : 'info',
    formatters: {
      log: (obj) => ({
        cluster_id: cluster.isPrimary ? 'Master' : ENV.INDOMITABLE_CLUSTER,
        ...obj
      })
    }
  },
  transport
)
// logger.info('Logger initialized.')

export default logger
