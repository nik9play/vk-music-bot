import checkPremium from '../tools/checkPremium'

export default {
  name: "v24/7",
  description: "Режим 24/7",
  execute: async function(message, _args, options) {
    checkPremium(message, () => {
      const voiceConnection = message.client.voice.connections.get(message.guild.id)

      if (options.enable247List.has(message.guild.id)) {
        options.enable247List.delete(message.guild.id)
        message.reply("режим 24/7 выключен.")

        if (voiceConnection) {
          if (!options.serverQueue)
            return voiceConnection.channel.leave()

          if (voiceConnection.dispatcher)
            if (voiceConnection.dispatcher.paused) {
              clearTimeout(options.serverQueue.exitTimer)
              return voiceConnection.channel.leave()
            } 
        }
      } else {
        options.enable247List.add(message.guild.id)
        message.reply("режим 24/7 включен.")
      }
    })
  }
}