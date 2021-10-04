if (process.env.NODE_ENV == 'development') require('dotenv').config()

const { ShardingManager } = require('discord.js')
const manager = new ShardingManager('./dist/index.js', { token: process.env.DISCORD_TOKEN, mode: 'worker' })
const axios = require('axios').default

const winston = require('winston');
const LogzioWinstonTransport = require('winston-logzio');

const logzioWinstonTransport = new LogzioWinstonTransport({
  level: 'info',
  name: 'winston_logzio',
  token: 'DyFkIIiuopcGMWYOyKhBMEZgOOQhMxuc',
  host: 'listener-eu.logz.io',
});

const logger = winston.createLogger({
  format: winston.format.simple(),
  transports: [logzioWinstonTransport],
});

manager.on('shardCreate', shard => logger.log('error', `Launched shard ${shard.id}`))
manager.spawn().then(() => {
  if (process.env.NODE_ENV != 'development') sendInfo()
}).catch(console.error)

// function serversStringByDigit(digits) {
//   if (digits >= 10 && digits <= 20) {
//     return "серверов"
//   }

//   switch(digits % 10) {
//     case 1:
//       return "сервер"
//     case 2:
//     case 3:
//     case 4:
//       return "сервера"
//     default:
//       return "серверов"
//   }
// }

function sendInfo() {
  manager.fetchClientValues('guilds.cache.size')
    .then(async results => {
      const serverSize = results.reduce((acc, guildCount) => acc + guildCount, 0)

      manager.broadcastEval(`this.user.setPresence({activity: {name: '-vh | ${(serverSize/1000).toFixed(1)}k серверов', type: 2}})`)

      const lavalinkInfo = manager.broadcastEval(c => {
        const info = {
          playingPlayers: 0
        }
        c.manager.nodes.each(e => {
          info.playingPlayers += e.stats.playingPlayers
        })
        return info
      })

      axios.post('https://vk-api-v2.megaworld.space/metrics', {
        token: process.env.API_TOKEN,
        metrics: {
          servers: serverSize,
          serverShards: results,
          lavalinkInfo
        }
      })
        .then(res => {
          if (res.data.status === 'error') {
            console.log('Ошибка отправки статистики на метрику. (Ошибка сервера)', res.data.message)
          } else {
            console.log('Статистика отправлена на метрику.')
          }
        })
        .catch((e) => {
          console.log('Ошибка отправки статистики на метрику. (Ошибка подключения)', e.response.data)
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
                console.log('Ошибка отправки статистики на мониторинг. (Ошибка сервера)', res.data.error)
              } else {
                console.log('Статистика отправлена на мониторинг.')
              }
            })
            .catch(() => {
              console.log('Ошибка отправки статистики на мониторинг. (Ошибка подключения)')
            })
        })
    })
  .catch(err => {
    console.error('send stat err: ', err)
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
