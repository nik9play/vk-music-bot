export default async function play(guild, song, options) {
  const serverQueue = options.queue.get(guild.id)
  const voiceConnection = guild.client.voice.connections.get(guild.id)

  if (!song) {
    if (!options.enable247List.has(guild.id) && voiceConnection) 
      voiceConnection.channel.leave()
    
    options.queue.delete(guild.id)
    return
  }

  voiceConnection.voice.setDeaf(true)

  serverQueue.connection.play(song.url, { volume: false, highWaterMark: 50 })
    .on('finish', () => {
      serverQueue.songs.shift()
      play(guild, serverQueue.songs[0], options)
    })
    .on('error', error => {
      console.error(error)
    })
}