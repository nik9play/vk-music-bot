export default {
  name: "vn",
  description: "Пропустить трек",
  cooldown: 3,
  execute: async function skip(message, _args, options) {
    const player = options.shoukaku.getPlayer(message.guild.id)
    if (player) {
      player.stopTrack()
    
      const textPermissions = message.channel.permissionsFor(message.client.user)
      if (textPermissions.has("ADD_REACTIONS"))
        message.react('⏭️')
    }
  }
} 