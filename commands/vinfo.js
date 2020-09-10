export default {
  name: "vinfo",
  description: "Информация о боте",
  cooldown: 10,
  execute: async function(message, args, options) {
    let totalServers = await message.client.shard.fetchClientValues('guilds.cache.size')
    totalServers = totalServers.reduce((acc, guildCount) => acc + guildCount, 0)

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
          "value": `\`\`\`js\n${options.shoukaku.totalPlayers}\`\`\``,
          "inline": true
        },
        {
          "name": "Пинг",
          "value": `\`\`\`js\n${message.client.ws.ping} MS\`\`\``,
          "inline": true
        },
      ]
    }

    message.channel.send({embed})
  }
}