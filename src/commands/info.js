export default {
  name: "info",
  adminOnly: true,
  cooldown: 10,
  execute: async function(message) {
    let totalServers = await message.client.shard.fetchClientValues('guilds.cache.size')
    totalServers = totalServers.reduce((acc, guildCount) => acc + guildCount, 0)

    let totalPlayers = 0
    message.client.manager.nodes.each(e => {
      totalPlayers += e.stats.playingPlayers
    })

    let RamLl = 0
    message.client.manager.nodes.each(e => {
      RamLl += e.stats.memory.used
    })

    let avCPULl = 0
    let llcount = 0
    message.client.manager.nodes.each(e => {
      avCPULl += e.stats.cpu.lavalinkLoad
      llcount++
    })

    avCPULl /= llcount

    const embed = {
      "author": {
        "name": "Информация о боте"
      },
      "color": 0x5181b8,
      "fields": [
        {
          "name": "Shard RAM",
          "value": `\`\`\`js\n${Math.round(process.memoryUsage().rss / 1024 / 1024 * 100) / 100} MB\`\`\``,
          "inline": true
        },
        {
          "name": "Lavalink RAM",
          "value": `\`\`\`js\n${Math.round(RamLl / 1024 / 1024 * 100) / 100} MB\`\`\``,
          "inline": true
        },
        {
          "name": "Загрузка Lavalink",
          "value": `\`\`\`js\n${avCPULl.toFixed(3)}\`\`\``,
          "inline": true
        },
        {
          "name": "Кол-во серверов шарда",
          "value": `\`\`\`js\n${message.client.guilds.cache.size}\`\`\``,
          "inline": true
        },
        {
          "name": "Всего серверов",
          "value": `\`\`\`js\n${totalServers}\`\`\``,
          "inline": true
        },
        {
          "name": "Кол-во шардов",
          "value": `\`\`\`js\n${message.client.shard.count}\`\`\``,
          "inline": true
        },
        {
          "name": "Номер шарда",
          "value": `\`\`\`js\n${message.guild.shardID}\`\`\``,
          "inline": true
        },
        {
          "name": "Всего плееров",
          "value": `\`\`\`js\n${totalPlayers}\`\`\``,
          "inline": true
        },
        {
          "name": "Пинг",
          "value": `\`\`\`js\n${message.client.ws.ping} MS\`\`\``,
          "inline": true
        },
        {
          "name": "ID сервера",
          "value": `\`\`\`js\n${message.guild.id}\`\`\``,
          "inline": true
        },
      ]
    }

    message.channel.send({embed})
  }
}