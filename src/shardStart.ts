//import { ShardingManager } from 'discord.js'
//const manager = new ShardingManager('./dist/index.js', { token: process.env.DISCORD_TOKEN, mode: 'process', respawn: true })

import Cluster from 'discord-hybrid-sharding-vk'
//import axios from 'axios'
import logger from './Logger.js'
import { Client } from 'discord.js'
import express from 'express'

import cross from 'discord-cross-ratelimit'
import { fetch } from 'undici'
import { VkMusicBotClient } from './client.js'

const { RatelimitManager } = cross

const manager = new Cluster.Manager('./dist/index.js', {
  totalShards: 4,
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

// manager.on('shardCreate', shard => logger.log('info', `Launched shard ${shard.id}`))
// manager.spawn().then(() => {
//    sendInfo()
// }).catch(err => logger.log('error', 'Error starting shard %O', err))

function sendInfo() {
  manager
    .fetchClientValues('guilds.cache.size')
    .then(async (results) => {
      const serverSize: number = results.reduce((acc, guildCount) => acc + guildCount, 0)

      function setPr(c: Client, { servers }: any) {
        if (c.user) {
          c.user.setPresence({
            activities: [
              {
                name: `/help | ${(servers / 1000).toFixed(1)}k серверов`,
                type: 2
              }
            ]
          })
        }
      }

      await manager.broadcastEval(setPr, { context: { servers: serverSize } })

      try {
        const res = await fetch('https://vk-api-v2.megaworld.space/metrics', {
          method: 'POST',
          body: JSON.stringify({
            token: process.env.API_TOKEN,
            metrics: {
              servers: serverSize,
              serverShards: results
              //lavalinkInfo
            }
          })
        })

        const data = (await res.json()) as any

        if (!res.ok) {
          logger.error(`Send metrics error (http error). ${res.status}`)
          return
        }

        if (data.status === 'error') {
          logger.error('Error sending stats (server error)')
        } else {
          logger.info('Stats sent.')
        }
      } catch {
        logger.error('Send metrics error (request error).')
      }

      manager.fetchClientValues('user.id').then(async (results) => {
        const id = results[0]

        try {
          const res = await fetch(`https://api.server-discord.com/v2/bots/${id}/stats`, {
            method: 'POST',
            body: JSON.stringify({
              servers: serverSize,
              shards: manager.totalShards
            }),
            headers: {
              Authorization: 'SDC ' + process.env.SDC_TOKEN
            }
          })

          const data = (await res.json()) as any

          if (!res.ok) {
            logger.error(`Send stats error (http error). ${res.status}`)
            return
          }

          if (data.error) {
            logger.error('Error sending stats (server error)')
          } else {
            logger.info('Stats sent.')
          }
        } catch {
          logger.error('Error sending stats (connection error)')
        }
      })
    })
    .catch((err) => {
      logger.error({ err }, 'Send stat error')
    })
}

const app = express()
const port = 8888

app.get('/api/restart', async (req, res) => {
  manager.recluster?.start({ restartMode: 'rolling' })
  res.json({ message: 'Restarting in process...' })
})

app.get('/api/clear-queue', async (req, res) => {
  function clearQueues(c: Client) {
    const botClient = c as VkMusicBotClient
    for (const player of botClient.manager.players.values()) {
      player.destroy()
      //player.queue.clear()
    }
  }

  await manager.broadcastEval(clearQueues)

  res.json({ message: 'All queues has been cleared.' })
})

app.listen(port, () => {
  console.log(`Example app listening on port ${port}`)
})

// process.stdin.resume()
//
// function exitHandler(options: any, exitCode: number) {
//   if (options.cleanup) console.log('clean')
//   if (exitCode || exitCode === 0) console.log(exitCode)
//   if (options.exit) process.exit()
// }
//
// process.on('exit', exitHandler.bind(null, { cleanup: true }))
//
// //catches ctrl+c event
// process.on('SIGINT', exitHandler.bind(null, { exit: true }))
//
// // catches "kill pid" (for example: nodemon restart)
// process.on('SIGUSR1', exitHandler.bind(null, { exit: true }))
// process.on('SIGUSR2', exitHandler.bind(null, { exit: true }))
