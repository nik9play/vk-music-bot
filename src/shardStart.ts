//import { ShardingManager } from 'discord.js'
//const manager = new ShardingManager('./dist/index.js', { token: process.env.DISCORD_TOKEN, mode: 'process', respawn: true })

import Cluster from 'discord-hybrid-sharding-vk'
import axios from 'axios'
import logger from './Logger'
import { Client } from 'discord.js'

import { RatelimitManager } from 'discord-cross-ratelimit'

const manager = new Cluster.Manager('./dist/index.js', {
  totalShards: parseInt(process.env.VK_TOTAL_SHARDS ?? '144'),
  shardsPerClusters: parseInt(process.env.SHARDS_PER_CLUSTER ?? '4'),
  mode: 'process',
  token: process.env.DISCORD_TOKEN,
  restarts: {
    max: 5,
    interval: 60*60*1000
  }
})

new RatelimitManager(manager, { inactiveTimeout: 240000, requestOffset: 500 })

manager.on('clusterCreate', cluster => {
  logger.info(`Launched cluster ${cluster.id}`)
})

manager.on('debug', msg => logger.info(msg, 'CLUSTER MANAGER'))

manager.spawn({ timeout: 240000 }).then(() => {
  logger.info(`Manager finished spawning clusters. Total clusters: ${manager.totalClusters}`)
  setTimeout(() => {
    sendInfo()
    if (process.env.NODE_ENV != 'development') setInterval(() => {
      sendInfo()
    }, 1800000)
  }, 1800000)
})

// manager.on('shardCreate', shard => logger.log('info', `Launched shard ${shard.id}`))
// manager.spawn().then(() => {
//    sendInfo()
// }).catch(err => logger.log('error', 'Error starting shard %O', err))

function sendInfo() {
  manager.fetchClientValues('guilds.cache.size')
    .then(async results => {
      const serverSize: number = results.reduce((acc, guildCount) => acc + guildCount, 0)

      function setPr(c: Client, { servers }: any) {
        if (c.user) {
          c.user.setPresence({
            activities: [{ name: `/help | ${(servers / 1000).toFixed(1)}k серверов`, type: 2 }]
          })
        }
      }

      await manager.broadcastEval(setPr, { context: { servers: serverSize } })

      axios.post('https://vk-api-v2.megaworld.space/metrics', {
        token: process.env.API_TOKEN,
        metrics: {
          servers: serverSize,
          serverShards: results
          //lavalinkInfo
        }
      })
        .then(res => {
          if (res.data.status === 'error') {
            logger.error('Error sending stats (server error)')
          } else {
            logger.info('Stats sent.')
          }
        })
        .catch(() => {
          logger.error('Error sending stats (connection error)')
        })

      manager.fetchClientValues('user.id')
        .then(results => {
          const id = results[0]

          axios.post(`https://api.server-discord.com/v2/bots/${id}/stats`, {
            servers: serverSize,
            shards: manager.totalShards
          },
          {
            headers: {
              'Authorization': 'SDC ' + process.env.SDC_TOKEN
            }
          })
            .then(res => {
              if (res.data.error) {
                logger.error('Error sending stats (server error)')
              } else {
                logger.info('Stats sent.')
              }
            })
            .catch(() => {
              logger.error('Error sending stats (connection error)')
            })
        })
    })
    .catch(err => {
      logger.error({ err }, 'Send stat error')
    })
}

process.stdin.resume()

function exitHandler(options: any, exitCode: number) {
  if (options.cleanup) console.log('clean')
  if (exitCode || exitCode === 0) console.log(exitCode)
  if (options.exit) process.exit()
}

process.on('exit', exitHandler.bind(null, { cleanup: true }))

//catches ctrl+c event
process.on('SIGINT', exitHandler.bind(null, { exit: true }))

// catches "kill pid" (for example: nodemon restart)
process.on('SIGUSR1', exitHandler.bind(null, { exit: true }))
process.on('SIGUSR2', exitHandler.bind(null, { exit: true }))
