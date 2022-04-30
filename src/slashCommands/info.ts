import {Command} from '../SlashCommandManager'

export default new Command({
  name: 'info',
  adminOnly: true,
  premium: false,
  djOnly: false,
  cooldown: 10,
  execute: async function({client, respond, guild}) {
    let totalServers = await client.cluster.fetchClientValues('guilds.cache.size')
    totalServers = totalServers.reduce((acc, guildCount) => acc + guildCount, 0)

    let totalPlayers = 0
    client.manager.nodes.each(e => {
      totalPlayers += e.stats.playingPlayers
    })

    let RamLl = 0
    client.manager.nodes.each(e => {
      RamLl += e.stats.memory.used
    })

    let avCPULl = 0
    let llcount = 0
    client.manager.nodes.each(e => {
      avCPULl += e.stats.cpu.lavalinkLoad
      llcount++
    })

    avCPULl /= llcount

    const embed = {
      'author': {
        'name': 'Информация о боте'
      },
      'color': 0x5181b8,
      'fields': [
        {
          'name': 'Shard RAM',
          'value': `\`\`\`js\n${Math.round(process.memoryUsage().rss / 1024 / 1024 * 100) / 100} MB\`\`\``,
          'inline': true
        },
        {
          'name': 'Lavalink RAM',
          'value': `\`\`\`js\n${Math.round(RamLl / 1024 / 1024 * 100) / 100} MB\`\`\``,
          'inline': true
        },
        {
          'name': 'Загрузка Lavalink',
          'value': `\`\`\`js\n${avCPULl.toFixed(3)}\`\`\``,
          'inline': true
        },
        {
          'name': 'Кол-во серверов шарда',
          'value': `\`\`\`js\n${client.guilds.cache.size}\`\`\``,
          'inline': true
        },
        {
          'name': 'Всего серверов',
          'value': `\`\`\`js\n${totalServers}\`\`\``,
          'inline': true
        },
        {
          'name': 'Кол-во шардов',
          'value': `\`\`\`js\n${client.cluster.count}\`\`\``,
          'inline': true
        },
        {
          'name': 'Номер шарда',
          'value': `\`\`\`js\n${guild.shardId}\`\`\``,
          'inline': true
        },
        {
          'name': 'Всего плееров',
          'value': `\`\`\`js\n${totalPlayers}\`\`\``,
          'inline': true
        },
        {
          'name': 'Пинг',
          'value': `\`\`\`js\n${client.ws.ping} MS\`\`\``,
          'inline': true
        },
        {
          'name': 'ID сервера',
          'value': `\`\`\`js\n${guild.id}\`\`\``,
          'inline': true
        },
      ]
    }

    respond({embeds: [embed], ephemeral: true})
  }
})