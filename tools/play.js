export default async function play(guild, song, options) {
  const serverQueue = options.queue.get(guild.id)

  if (!song) {
    if (!options.enable247List.has(guild.id)) serverQueue.voiceChannel.leave()
    options.queue.delete(guild.id)
    return
  }

  serverQueue.connection.play(song.url, { volume: false, highWaterMark: 50 })
    .on('finish', () => {
      serverQueue.songs.shift()
      play(guild, serverQueue.songs[0], options)
    })
    .on('error', error => {
      console.error(error)
    })
}