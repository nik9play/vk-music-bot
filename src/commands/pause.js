export default {
  name: "pause",
  aliases: ["ps", "resume"],
  djOnly: true,
  execute: async function(message) {
    const player = message.client.manager.get(message.guild.id)
    if (!player) return message.reply("сейчас ничего не играет.")

    const { channel } = message.member.voice
    
    if (!channel) return message.reply('необходимо находиться в голосовом канале.')
    //if (channel.id !== player.voiceChannel) return message.reply("вы находитесь не в том голосовом канале.")

    if (player.paused) {
      if (message.client.timers.has(message.guild.id))
        clearTimeout(message.client.timers.get(message.guild.id))
      
      const textPermissions = message.channel.permissionsFor(message.client.user)
      if (textPermissions.has("ADD_REACTIONS"))
        message.react('▶️') 
      return player.pause(false)
    }

    if (!await message.client.configDB.get247(message.guild.id))
      message.client.timers.set(message.guild.id, setTimeout(() => {
        message.channel.send({embed: {
          description: `**Я покинул канал, так как слишком долго был неактивен.**\n Хотите, чтобы я оставался? Включите режим 24/7 (доступен только для Премиум пользователей, подробности: \`-vdonate\`). `,
          color: 0x5181b8
        }}).then(msg => msg.delete({timeout: 30000}))
        if(player) player.destroy()
      }, 1200000))

    const textPermissions = message.channel.permissionsFor(message.client.user)
    if (textPermissions.has("ADD_REACTIONS"))
      message.react('⏸️') 
    return player.pause(true)
  }
}