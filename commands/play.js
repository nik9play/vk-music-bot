export default async function play(guild, song, queue) {
  const serverQueue = queue.get(guild.id)

  if (!song) {
    serverQueue.voiceChannel.leave()
    queue.delete(guild.id)
    return
  }

  const dispatcher = serverQueue.connection.play(song.url)
    .on('finish', () => {
      console.log('Music ended!')
      serverQueue.songs.shift()
      play(guild, serverQueue.songs[0])
    })
    .on('error', error => {
      console.error(error)
    })
  dispatcher.setVolumeLogarithmic(serverQueue.volume / 5)
}