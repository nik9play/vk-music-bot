export default {
  name: "vs",
  description: "Выключить музыку и очистить очередь",
  cooldown: 5,
  execute: async function(message, _args, options) {
    const player = options.shoukaku.getPlayer(message.guild.id)

    if (player) {
      const serverQueue = options.queue.get(message.guild.id)
      serverQueue.songs.length = 0
      player.stopTrack()
    
      const textPermissions = message.channel.permissionsFor(message.client.user)
      if (textPermissions.has("ADD_REACTIONS"))
        message.react('⏹️')
    }
  }
}