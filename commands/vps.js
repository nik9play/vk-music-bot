export default {
  name: "vps",
  description: "Пауза и воспроизведение",
  cooldown: 2,
  execute: async function(message, _args, options) {
    const voiceConnection = message.client.voice.connections.get(message.guild.id)

    if (voiceConnection)
      if (voiceConnection.dispatcher)
        if (!voiceConnection.dispatcher.paused) {
          voiceConnection.dispatcher.pause()
          options.serverQueue.exitTimer = setTimeout(async () => {
            if (!options.enable247List.has(message.guild.id)) {
              const voiceConnection = message.client.voice.connections.get(message.guild.id)
              if (voiceConnection.channel)
                voiceConnection.channel.leave()
            }
          }, 1800000)
          message.react('⏸️')
        } else {
          voiceConnection.dispatcher.resume()
          message.react('▶️')
          if (options.serverQueue.exitTimer) clearTimeout(options.serverQueue.exitTimer)
        }
  }
} 