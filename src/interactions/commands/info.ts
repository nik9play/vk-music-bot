// import { ShardClientUtil } from 'indomitable'
import { SlashCommandBuilder } from 'discord.js'
import { CommandCustomInteraction } from '../commandInteractions.js'
import { ENV } from '../../modules/env.js'

export const interaction: CommandCustomInteraction = {
  name: 'info',
  adminOnly: false,
  cooldown: 10,
  data: new SlashCommandBuilder()
    .setName('info')
    .setDescription('Вывод информации о боте')
    .setDMPermission(false),
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
      color: 0x235dff,
      fields: [
        {
          name: 'Cluster RAM',
          value: `\`\`\`js\n${
            Math.round((process.memoryUsage().rss / 1024 / 1024) * 100) / 100
          } MB\`\`\``,
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
          value: `\`\`\`js\n${ENV.INDOMITABLE_CLUSTER_TOTAL}\`\`\``,
          inline: true
        },
        {
          name: 'Номер кластера',
          value: `\`\`\`js\n${ENV.INDOMITABLE_CLUSTER}\`\`\``,
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
