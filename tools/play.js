export default async function play(guild, song, options) {
  const serverQueue = options.queue.get(guild.id)
  const player = options.shoukaku.getPlayer(guild.id)

  if (!song) {
    if (!options.enable247List.has(guild.id) && player)
      player.disconnect()
    
    options.queue.delete(guild.id)
    return console.log(`${guild.id} закончил воспроизводить треки`)
  }

  // if (voiceConnection) {
  //   const permissions = voiceConnection.channel.permissionsFor(guild.client.user)

    
  //   if (permissions.has("DEAFEN_MEMBERS"))
  //     voiceConnection.voice.setSelfDeaf(true)

  //   if (!permissions.has('CONNECT') || !permissions.has('SPEAK') || !permissions.has('VIEW_CHANNEL')) {
  //     serverQueue.textChannel.send('Кажется, вы переместили бота в канал, в котором ему не хватает прав. Выдадите ему право "Администратор", чтобы больше не возникало подобных проблем.')
  //     voiceConnection.channel.leave()
    
  //     options.queue.delete(guild.id)
  //     return
  //   }
  // }

  const node = options.shoukaku.getNode()
  const rest = node.rest

  rest.resolve(song.url).then(songResolved => {
    player.playTrack(songResolved.tracks[0].track)
    
    player.on("end", () => {
      options.serverQueue.songs.shift()
      play(guild, serverQueue.songs[0], options)
    })
  })
}