if (process.env.NODE_ENV == 'development') require('dotenv').config()

import { ShardingManager } from 'discord.js'
const manager = new ShardingManager('./dist/index.js', { token: process.env.DISCORD_TOKEN, mode: 'process', respawn: true })
import axios from 'axios'
import logger from './src/tools/logger'

manager.on('shardCreate', shard => logger.log('info', `Launched shard ${shard.id}`))
manager.spawn().then(() => {
   sendInfo()
}).catch(err => logger.log('error', 'Error starting shard %O', err))

function sendInfo() {
  manager.fetchClientValues('guilds.cache.size')
    .then(async results => {
      const serverSize = results.reduce((acc, guildCount) => acc + guildCount, 0)

      function setPr (c, { servers }) {
        if (c.user) {
          c.user.setPresence({
            activities: [{name: `/help | ${(servers/1000).toFixed(1)}k серверов`, type: 2}]
          })
        }
      }

      manager.broadcastEval(setPr, { context: { servers: serverSize }})

      // manager.shards.get(0).

      // const lavalinkInfo = manager.broadcastEval(c => {
      //   const info = {
      //     playingPlayers: 0
      //   }
      //   c.manager.nodes.each(e => {
      //     info.playingPlayers += e.stats.playingPlayers
      //   })
      //   return info
      // })

      axios.post('https://vk-api-v2.megaworld.space/metrics', {
        token: process.env.API_TOKEN,
        metrics: {
          servers: serverSize,
          serverShards: results,
          //lavalinkInfo
        }
      })
        .then(res => {
          if (res.data.status === 'error') {
            logger.log('error', 'Ошибка отправки статистики на метрику. (Ошибка сервера) %s', res.data.message)
          } else {
            logger.log('info', 'Статистика отправлена на метрику.')
          }
        })
        .catch((e) => {
          logger.log('error', 'Ошибка отправки статистики на метрику. (Ошибка подключения) %O', e.response.data)
        })

      manager.fetchClientValues('user.id')
        .then(results => {
          const id = results[0]

          axios.post(`https://api.server-discord.com/v2/bots/${id}/stats`, {
            servers: serverSize,
            shards: manager.shards.size
          },
          {
            headers: {
              'Authorization': 'SDC ' + process.env.SDC_TOKEN
            }
          })
            .then(res => {
              if (res.data.error) {
                logger.log('error', 'Ошибка отправки статистики на мониторинг. (Ошибка сервера) %s', res.data.error)
              } else {
                logger.log('info', 'Статистика отправлена на мониторинг.')
              }
            })
            .catch(() => {
              logger.log('error', 'Ошибка отправки статистики на мониторинг. (Ошибка подключения)')
            })
        })
    })
  .catch(err => {
    logger.error('error', 'Send stat error %O', err)
  })
}

if (process.env.NODE_ENV != 'development') setInterval(() => {
  sendInfo()
}, 300000)

process.stdin.resume()

function exitHandler(options, exitCode) {
  if (options.cleanup) console.log('clean')
  if (exitCode || exitCode === 0) console.log(exitCode)
  if (options.exit) process.exit();
}

process.on('exit', exitHandler.bind(null,{cleanup:true}))

//catches ctrl+c event
process.on('SIGINT', exitHandler.bind(null, {exit:true}))

// catches "kill pid" (for example: nodemon restart)
process.on('SIGUSR1', exitHandler.bind(null, {exit:true}))
process.on('SIGUSR2', exitHandler.bind(null, {exit:true}))
