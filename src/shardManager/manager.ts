import Cluster from 'discord-hybrid-sharding-vk'
import logger from '../logger.js'
import { RatelimitManager } from 'discord-cross-ratelimit'
import { sendInfo } from './stats.js'

const manager = new Cluster.Manager('./dist/bot.js', {
  totalShards: 'auto',
  shardsPerClusters: 2,
  mode: 'worker',
  token: process.env.DISCORD_TOKEN,
  restarts: {
    max: 5,
    interval: 60 * 60 * 1000
  }
})

manager.extend(new Cluster.ReClusterManager())

new RatelimitManager(manager, { inactiveTimeout: 240000, requestOffset: 500 })

manager.on('clusterCreate', (cluster) => {
  logger.info(`Launched cluster ${cluster.id}`)
})

manager.on('debug', (msg) => logger.info(msg, 'Cluster manager debug'))

function startShardManager() {
  manager.spawn({ timeout: 240000 }).then(() => {
    logger.info(`Manager finished spawning clusters. Total clusters: ${manager.totalClusters}`)
    setTimeout(() => {
      sendInfo()
      if (process.env.NODE_ENV != 'development')
        setInterval(() => {
          sendInfo()
        }, 1800000)
    }, 1800000)
  })
}

export default manager
export { startShardManager }
