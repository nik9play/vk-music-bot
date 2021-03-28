export default {
  name: "fix",
  adminOnly: true,
  cooldown: 5,
  execute: async (message) => { 
    const player = message.client.manager.get(message.guild.id)
    if (!player) return

    if (message.client.timers.has(message.guild.id))
      clearTimeout(message.client.timers.get(message.guild.id))

    player.destroy()
    
    const textPermissions = message.channel.permissionsFor(message.client.user)
    if (textPermissions.has("ADD_REACTIONS"))
      message.react('🔧')
  }
}