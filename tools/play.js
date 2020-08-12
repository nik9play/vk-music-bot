export default async function play(guild, song, options) {
  const serverQueue = options.queue.get(guild.id)
  const voiceConnection = guild.client.voice.connections.get(guild.id)

  if (!song) {
    if (!options.enable247List.has(guild.id) && voiceConnection) 
      voiceConnection.channel.leave()
    
    options.queue.delete(guild.id)
    return
  }

  if (voiceConnection) {
    const permissions = voiceConnection.channel.permissionsFor(guild.client.user)

    
    if (permissions.has("DEAFEN_MEMBERS"))
      voiceConnection.voice.setDeaf(true)

    if (!permissions.has('CONNECT') || !permissions.has('SPEAK') || !permissions.has('VIEW_CHANNEL')) {
      serverQueue.textChannel.send('Кажется, вы переместили бота в канал, в котором ему не хватает прав. Выдадите ему право "Администратор", чтобы больше не возникало подобных проблем.')
      voiceConnection.channel.leave()
    
      options.queue.delete(guild.id)
      return
    }
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