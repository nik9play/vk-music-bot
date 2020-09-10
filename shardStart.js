const { ShardingManager } = require('discord.js')
const manager = new ShardingManager('./dist/main.js', { token: process.env.DISCORD_TOKEN })
const axios = require('axios').default

manager.on("shardCreate", shard => console.log(`Launched shard ${shard.id}`))
manager.spawn().then(() => {
  sendInfo()
})

function serversStringByDigit(digits) {
  if (digits >= 10 && digits <= 20) {
    return "серверов"
  }

  switch(digits % 10) {
    case 1:
      return "сервер"
    case 2:
    case 3:
    case 4:
      return "сервера"
    default:
      return "серверов"
  }
}

function sendInfo() {
  manager.fetchClientValues("guilds.cache.size")
    .then(results => {
      const serverSize = results.reduce((acc, guildCount) => acc + guildCount, 0)
      
      manager.broadcastEval(`this.user.setPresence({activity: {name: '-vh | ${serverSize} ${serversStringByDigit(serverSize % 100)}', type: 2}})`)

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
                console.log("Ошибка отправки статистики на мониторинг. (Ошибка сервера)")
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