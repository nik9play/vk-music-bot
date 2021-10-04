import { Duration } from 'luxon'
import { MessageEmbed } from 'discord.js'
import generateErrorMessage from '../tools/generateErrorMessage'

export default {
  name: 'queue',
  description: 'Показать очередь',
  aliases: ['q'],
  djOnly: true,
  cooldown: 3,
  execute: async function({ guild, respond, args, client }) {
    const player = client.manager.get(guild.id)
    if (!player) return respond({ embeds: [generateErrorMessage('Сейчас ничего не играет.')], ephemeral: true })

    const queue = player.queue
    const embed = new MessageEmbed()
      .setAuthor('Треки в очереди')
      .setColor(0x5181b8)

    const multiple = 10
    let page = args.length && Number(args[0]) ? Number(args[0]) : 1
    page = page < 0 ? 1 : page

    const end = page * multiple
    const start = end - multiple

    const tracks = queue.slice(start, end)

    if (queue.current) embed.addField('Сейчас играет', 
      `${queue.current.author} — ${queue.current.title} (${Duration.fromMillis(player.position).toFormat('mm:ss')}/${Duration.fromMillis(queue.current.duration).toFormat('mm:ss')})`)
    //console.log(queue.current)

    if (!tracks.length) embed.setDescription(`Нет треков на странице \`${page}\`.`)
    else embed.setDescription(tracks.map((track, i) => `${start + (++i)}. ${track.author} — ${track.title}`).join('\n'))

    const maxPages = Math.ceil(queue.length / multiple)

    embed.setFooter(`Страница ${page > maxPages ? maxPages : page} из ${maxPages}`)

    return respond({ embeds: [embed] }, 60000)
  }
}