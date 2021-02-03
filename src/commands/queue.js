//import { Duration } from 'luxon'
import { MessageEmbed } from 'discord.js'

export default {
  name: "queue",
  description: "Показать очередь",
  aliases: ["q"],
  djOnly: true,
  cooldown: 3,
  execute: async function(message, args) {
    const player = message.client.manager.get(message.guild.id);
    if (!player) return message.reply("сейчас ничего не играет.");

    const queue = player.queue
    const embed = new MessageEmbed()
      .setAuthor(`Очередь`)
      .setColor(0x5181b8)

    const multiple = 10
    const page = args.length && Number(args[0]) ? Number(args[0]) : 1

    const end = page * multiple
    const start = end - multiple

    const tracks = queue.slice(start, end)

    if (queue.current) embed.addField("Сейчас играет", `${queue.current.author} — ${queue.current.title}`)

    if (!tracks.length) embed.setDescription(`Нет треков на странице \`${page}\`.`)
    else embed.setDescription(tracks.map((track, i) => `${start + (++i)}. ${track.author} — ${track.title}`).join("\n"))

    const maxPages = Math.ceil(queue.length / multiple)

    embed.setFooter(`Страница ${page > maxPages ? maxPages : page} из ${maxPages}`)

    return message.reply(embed);
  }
}