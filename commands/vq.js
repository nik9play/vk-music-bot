import { Duration } from 'luxon'

export default {
  name: "vq",
  description: "Показать очередь",
  cooldown: 3,
  execute: async function(message, args, options) {
    const serverQueue = options.serverQueue

    if (!serverQueue) return message.reply('очередь пуста.')

    if (isNaN(args[0]) && args[0]) return message.reply("неверный `offset`")
    const songs = serverQueue.songs
    let offset = args[0] ? (args[0] * 10) - 10 + 1 : 1
    let count = offset + 9
    
    if (songs.length - (offset - 1) < 10) count = offset + songs.length - (offset - 1) - 1

    if (offset > count) return message.reply("больше ничего нет.")
    
    let list = ""
    let current = `Сейчас играет: **${songs[0].artist} — ${songs[0].title}**`

    for (let i = offset - 1; i <= count - 1; i++) {
      const e = songs[i]
      list += `${i + 1}. ${e.artist} — ${e.title}\n`
    }

    const embed = {
      color: 0x5181b8,
      title: "**Музыка в очереди:**",
      description: list,
      fields: [
        {
          name: current,
          value: `${serverQueue.connection.dispatcher.paused ? ":pause_button:" : ":arrow_forward:"} ${Duration.fromMillis(serverQueue.connection.dispatcher.streamTime).toFormat("mm:ss")} / ${Duration.fromObject({seconds: songs[0].duration}).toFormat("mm:ss")}`
        },
        {
          name: `${args[0] ?? 1} / ${Math.ceil(songs.length / 10)}`,
          value: (count < songs.length) ? `\nЧтобы просмотреть список дальше, введите \`-vq ${parseInt(args[0] ?? 1) + 1}\`` : "Конец."
        }
      ]
    }

    message.channel.send({embed: embed})
  }
}