export default {
  name: "v24/7",
  description: "Режим 24/7",
  premium: true,
  cooldown: 2,
  execute: async function(message, _args, options) {
    const player = options.shoukaku.getPlayer(message.guild.id)
    const serverQueue = options.queue.get(message.guild.id)

    if (options.enable247List.has(message.guild.id)) {
      options.enable247List.delete(message.guild.id)
      message.reply("режим 24/7 выключен.")

      if (player) {

        if (!serverQueue)
          return player.disconnect()

        if (serverQueue)
          if (serverQueue.exitTimer)
            clearTimeout(serverQueue.exitTimer)

      }
    } else {
      options.enable247List.add(message.guild.id)
      message.reply("режим 24/7 включен.")
    }
  }
}