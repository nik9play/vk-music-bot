export default {
  name: "leave",
  djOnly: true,
  cooldown: 1,
  execute: async (message) => { 
    const player = message.client.manager.get(message.guild.id)
    if (!player) return message.reply("сейчас ничего не играет.")

    const { channel } = message.member.voice;
    
    if (!channel) return message.reply('необходимо находиться в голосовом канале.')
    if (channel.id !== player.voiceChannel) return message.reply("вы находитесь не в том голосовом канале.")
    
    if (message.client.timers.has(message.guild.id))
      clearTimeout(message.client.timers.get(message.guild.id))

    player.destroy()
    
    const textPermissions = message.channel.permissionsFor(message.client.user)
    if (textPermissions.has("ADD_REACTIONS"))
      message.react('👋') 
  }
}