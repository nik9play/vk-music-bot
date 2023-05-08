// import { ShardClientUtil } from 'indomitable'
import { CommandCustomInteraction } from '../commandInteractions.js'

export const interaction: CommandCustomInteraction = {
  name: 'info',
  adminOnly: true,
  premium: false,
  djOnly: false,
  cooldown: 10,
  execute: async function ({ client, respond, guild }) {
    // const totalServers = 0

    // const shardClientUtil = client.shard as ShardClientUtil | null

    // shardClientUtil?.ipc

    let totalPlayers = 0
    let totalRam = 0

    let avgCPU = 0
    let count = 0

    client.shoukaku.nodes.forEach((e) => {
      totalPlayers += e.stats?.playingPlayers ?? 0
      totalRam += e.stats?.memory.used ?? 0
      avgCPU += e.stats?.cpu.lavalinkLoad ?? 0
      count++
    })

    avgCPU /= count

    const player = client.playerManager.get(guild.id)

    const embed = {
      author: {
        name: 'Информация о боте'
      },
      color: 0x5181b8,
      fields: [
        {
          name: 'Cluster RAM',
          value: `\`\`\`js\n${Math.round((process.memoryUsage().rss / 1024 / 1024) * 100) / 100} MB\`\`\``,
          inline: true
        },
        {
          name: 'Lavalink RAM',
          value: `\`\`\`js\n${Math.round((totalRam / 1024 / 1024) * 100) / 100} MB\`\`\``,
          inline: true
        },
        {
          name: 'Загрузка Lavalink',
          value: `\`\`\`js\n${avgCPU.toFixed(3)}\`\`\``,
          inline: true
        },
        {
          name: 'Кол-во серверов кластера',
          value: `\`\`\`js\n${client.guilds.cache.size}\`\`\``,
          inline: true
        },
        // {
        //   name: 'Всего серверов',
        //   value: `\`\`\`js\n${totalServers}\`\`\``,
        //   inline: true
        // },
        {
          name: 'Кол-во кластеров',
          value: `\`\`\`js\n${process.env.INDOMITABLE_CLUSTER_TOTAL}\`\`\``,
          inline: true
        },
        {
          name: 'Номер кластера',
          value: `\`\`\`js\n${process.env.INDOMITABLE_CLUSTER}\`\`\``,
          inline: true
        },
        {
          name: 'Всего плееров',
          value: `\`\`\`js\n${totalPlayers}\`\`\``,
          inline: true
        },
        {
          name: 'Пинг',
          value: `\`\`\`js\n${client.ws.ping.toFixed(2)} MS\`\`\``,
          inline: true
        },
        {
          name: 'ID сервера',
          value: `\`\`\`js\n${guild.id}\`\`\``,
          inline: false
        },
        {
          name: 'Статистика Lavalink',
          value: `\`\`\`Название: ${player?.player.node.name ?? 'N/A'}\nВсего плееров: ${
            player?.player.node.stats?.players ?? 'N/A'
          }\`\`\``,
          inline: false
        }
      ]
    }

    await respond({ embeds: [embed], ephemeral: true })
  }
}
