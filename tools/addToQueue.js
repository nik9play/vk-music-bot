import play from '../tools/play'
import checkPremium from '../tools/checkPremium'

export default async function(options, message, voiceChannel, newArray) {
  if (!options.serverQueue) {
    if (newArray.length > 200) {
      const premium = await checkPremium(message, "ваш сервер не имеет **Премиума**, поэтому очередь сокращена до 200. Подробности: `-vdonate`")

      if (!premium) {
        newArray.length = 200
      }
    }

    const queueContruct = {
      textChannel: message.channel,
      songs: []
    }

    options.queue.set(message.guild.id, queueContruct)

    queueContruct.songs = [...queueContruct.songs, ...newArray]

    try {
      const node = options.shoukaku.getNode()
      let player = options.shoukaku.getPlayer(message.guild.id)

      if (!options.shoukaku.getPlayer(message.guild.id)) {
        player = await node.joinVoiceChannel({
          guildID: message.guild.id,
          voiceChannelID: voiceChannel.id
        })
      }

      player.on("closed", () => {
        options.queue.delete(message.guild.id)
        console.log(`${message.guild.id} бот отключился от канала`)
      })

      player.on("error", () => {
        options.queue.delete(message.guild.id)
        console.log(`${message.guild.id} ошибка плеера`)
      })

      play(message.guild, queueContruct.songs[0], options)
    } catch (err) {
      console.log(err)
      options.queue.delete(message.guild.id)
    }
  } else {
    let arr = [...options.serverQueue.songs, ...newArray]
    if (arr.length > 200) {
      const premium = await checkPremium(message, "ваш сервер не имеет **Премиума**, поэтому очередь сокращена до 200. Подробности: `-vdonate`")

      if (!premium) {
        arr.length = 200
      }
    }

    options.serverQueue.songs = arr
  }
}