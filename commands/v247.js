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
        
        // if (options.serverQueue) {
        //   if (options.serverQueue.connection.dispatcher.paused) {
        //     options.serverQueue.connection.dispatcher.resume()
        //     if (options.serverQueue.exitTimer) 
        //       clearTimeout(options.serverQueue.exitTimer)
        //   }
        // }

        if (voiceConnection) {
          if (!options.serverQueue)
            return voiceConnection.channel.leave()

          if (voiceConnection.dispatcher)
            if (voiceConnection.dispatcher.paused)
              return voiceConnection.channel.leave()
        }
      } else {
        options.enable247List.add(message.guild.id)
        message.reply("режим 24/7 включен.")
      }
    })
  }
}