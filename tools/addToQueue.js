import play from '../tools/play'

export default async function(options, message, voiceChannel, newArray) {
  if (!options.serverQueue) {
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
    options.serverQueue.songs = [...options.serverQueue.songs, ...newArray]
  }
}