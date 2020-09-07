export default {
  name: "vps",
  description: "Пауза и воспроизведение",
  cooldown: 2,
  execute: async function(message, _args, options) {
    const player = options.shoukaku.getPlayer(message.guild.id)
    const serverQueue = options.queue.get(message.guild.id)

    if (player && serverQueue) {
      if (player.paused) {
        player.setPaused(false)

        if (serverQueue.pauseTimer) {
          clearTimeout(serverQueue.pauseTimer)
        }

        const textPermissions = message.channel.permissionsFor(message.client.user)
        if (textPermissions.has("ADD_REACTIONS"))
          message.react('▶️')
      } else {
        player.setPaused(true)

        serverQueue.pauseTimer = setTimeout(() => {
          if (!options.enable247List.has(message.guild.id)) {
            options.queue.delete(message.guild.id)

            if (player)
              player.disconnect()
          }
        }, 36000000)

        const textPermissions = message.channel.permissionsFor(message.client.user)
        if (textPermissions.has("ADD_REACTIONS"))
          message.react('⏸️')
      }
    }
  }
} 