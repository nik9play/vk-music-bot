if (process.env.NODE_ENV == "development") require('dotenv').config()

const { ShardingManager } = require('discord.js')
const manager = new ShardingManager('./dist/main.js', { token: process.env.DISCORD_TOKEN })
const axios = require('axios').default

manager.on("shardCreate", shard => console.log(`Launched shard ${shard.id}`))
manager.spawn().then(() => {
  sendInfo()
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
    console.error(err)
  })
}

setInterval(() => {
  sendInfo()
}, 1800000)