import vps from "./vps"

export default {
  name: "vn",
  description: "Пропустить трек",
  cooldown: 3,
  execute: async function skip(message, args, options) {
    const player = options.shoukaku.getPlayer(message.guild.id)
    if (player) {
      if (player.paused) vps.execute(message, args, options)

      player.stopTrack()
    
      const textPermissions = message.channel.permissionsFor(message.client.user)
      if (textPermissions.has("ADD_REACTIONS"))
        message.react('⏭️')
    }
  }
} 