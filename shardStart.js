if (process.env.NODE_ENV == "development") require('dotenv').config()

const { ShardingManager } = require('discord.js')
const manager = new ShardingManager('./dist/index.js', { token: process.env.DISCORD_TOKEN })
const axios = require('axios').default

manager.on("shardCreate", shard => console.log(`Launched shard ${shard.id}`))
manager.spawn().then(() => {
  if (process.env.NODE_ENV != "development") sendInfo()
})

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
  manager.fetchClientValues("guilds.cache.size")
    .then(results => {
      const serverSize = results.reduce((acc, guildCount) => acc + guildCount, 0)

      manager.broadcastEval(`this.user.setPresence({activity: {name: '-vh | ${(serverSize/1000).toFixed(1)}k серверов', type: 2}})`)

      axios.post("https://vk-api-v2.megaworld.space/metrics", {
        token: process.env.API_TOKEN,
        metrics: {
          servers: serverSize,
          serverShards: results
        }
      })
        .then(res => {
          if (res.data.status === "error") {
            console.log("Ошибка отправки статистики на метрику. (Ошибка сервера)", res.data.message)
          } else {
            console.log("Статистика отправлена на метрику.")
          }
        })
        .catch((e) => {
          console.log("Ошибка отправки статистики на метрику. (Ошибка подключения)", e.response.data)
        })

      manager.fetchClientValues("user.id")
        .then(results => {
          const id = results[0]

          axios.post(`https://api.server-discord.com/v2/bots/${id}/stats`, {
            servers: serverSize,
            shards: manager.shards.size
          },
          {
            headers: {
              "Authorization": "SDC " + process.env.SDC_TOKEN
            }
          })
            .then(res => {
              if (res.data.error) {
                console.log("Ошибка отправки статистики на мониторинг. (Ошибка сервера)", res.data.error)
              } else {
                console.log("Статистика отправлена на мониторинг.")
              }
            })
            .catch(() => {
              console.log("Ошибка отправки статистики на мониторинг. (Ошибка подключения)")
            })
        })
    })
  .catch(err => {
    console.error("send stat err: ", err)
  })
}

if (process.env.NODE_ENV != "development") setInterval(() => {
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
