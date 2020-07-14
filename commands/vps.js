export default {
  name: "vps",
  description: "Пауза и воспроизведение",
  execute: async function(message, _args, options) {
    const voiceChannel = message.member.voice.channel
    if (!voiceChannel) return message.reply('вы должны быть в голосовом канале чтобы поставить музыку на паузу.')
    if (!options.serverQueue) return
    if (!options.serverQueue.connection.dispatcher.paused) {
      options.serverQueue.connection.dispatcher.pause()
      const id = message.guild.id
      options.serverQueue.exitTimer = setTimeout(async () => {
        if (!options.enable247List.has(message.guild.id)) {
          const serverQueueNew = options.queue.get(id)
          if (!serverQueueNew) return
          await serverQueueNew.connection.dispatcher.resume()
          serverQueueNew.songs = []
          serverQueueNew.connection.dispatcher.end()
        }
      }, 3600000)
      message.react('⏸️')
    } else {
      options.serverQueue.connection.dispatcher.resume()
      message.react('▶️')
      if (options.serverQueue.exitTimer) clearTimeout(options.serverQueue.exitTimer)
    }
  }
} 