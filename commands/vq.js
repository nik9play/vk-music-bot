import { Duration } from 'luxon'

export default {
  name: "vq",
  description: "Показать очередь",
  cooldown: 3,
  execute: async function(message, args, options) {
    const serverQueue = options.queue.get(message.guild.id)

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

    const player = options.shoukaku.getPlayer(message.guild.id)

    function getCurrentPosition() {
      if (player) {
        return `${player.paused ? ":pause_button:" : ":arrow_forward:"} ${Duration.fromMillis(player.position).toFormat("mm:ss")} / ${Duration.fromObject({seconds: songs[0].duration}).toFormat("mm:ss")}`
      }
    }

    let embed = {
      color: 0x5181b8,
      title: "**Музыка в очереди:**",
      description: list,
      fields: [
        {
          name: current,
          value: getCurrentPosition()
        },
        {
          name: `${args[0] ?? 1} / ${Math.ceil(songs.length / 10)}`,
          value: (count < songs.length) ? `\nЧтобы просмотреть список дальше, введите \`-vq ${parseInt(args[0] ?? 1) + 1}\`` : "Конец."
        }
      ]
    }

    if (serverQueue.loopType) {
      if (serverQueue.loopType == 1) {
        embed.fields.splice(1, 0, {
          name: ":repeat: Включено зацикливание очереди",
          value: `1. **${serverQueue.loopSongs[0].title}** ... ${serverQueue.loopSongs.length}. **${serverQueue.loopSongs[serverQueue.loopSongs.length-1].title}**`
        }) 
      } else if (serverQueue.loopType == 2) {
        embed.fields.splice(1, 0, {
          name: ":repeat_one: Включено зацикливание трека",
          value: `${songs[0].artist} — ${songs[0].title}`
        })
      }
    }

    const textPermissions = message.channel.permissionsFor(message.client.user)

    const filter = (reaction, user) => {
      return ['➡️', '⬅️'].includes(reaction.emoji.name) && user.id === message.author.id
    }

    const msg = await message.channel.send({embed: embed})

    if (args[0] > 1) {
      if (textPermissions.has("ADD_REACTIONS"))
        await msg.react("⬅️")
    }

    if (count < songs.length) {
      if (textPermissions.has("ADD_REACTIONS"))
        await msg.react("➡️")
    }

    msg.awaitReactions(filter, { max: 1, time: 30000, errors: ["time"]})
      .then(collected => {
        msg.delete()
        const reaction = collected.first()

        if (reaction.emoji.name === "➡️" && count < songs.length) {
          this.execute(message, [(args[0] ?? 1) + 1], options)
        } else if (reaction.emoji.name === "⬅️" && args[0] > 1) {
          this.execute(message, [args[0] - 1], options)
        }
      })
      .catch(() => {
        msg.delete()
      })
  }
}