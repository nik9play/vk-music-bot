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
      connection: null,
      songs: [],
      volume: 5,
      playing: true,
    }

    options.queue.set(message.guild.id, queueContruct)

    queueContruct.songs = [...queueContruct.songs, ...newArray]

    try {
      let connection = await voiceChannel.join()

      connection.on("disconnect", () => {
        options.queue.delete(message.guild.id)
      })

      queueContruct.connection = connection
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