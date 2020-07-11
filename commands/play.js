export default async function play(guild, song, queue) {
  const serverQueue = queue.get(guild.id)

  if (!song) {
    serverQueue.voiceChannel.leave()
    queue.delete(guild.id)
    return
  }

  serverQueue.connection.play(song.url, { volume: false })
    .on('finish', () => {
      console.log('Music ended!')
      serverQueue.songs.shift()
      play(guild, serverQueue.songs[0], queue)
    })
    .on('error', error => {
      console.error(error)
    })
}