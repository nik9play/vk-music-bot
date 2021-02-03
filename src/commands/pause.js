export default {
  name: "pause",
  aliases: ["ps", "resume"],
  djOnly: true,
  execute: async function(message) {
    const player = message.client.manager.get(message.guild.id)
    if (!player) return message.reply("сейчас ничего не играет.")

    const { channel } = message.member.voice
    
    if (!channel) return message.reply('необходимо находиться в голосовом канале.')
    if (channel.id !== player.voiceChannel) return message.reply("вы находитесь не в том голосовом канале.")

    if (player.paused) {
      if (message.client.timers.has(message.guild.id))
        clearTimeout(message.client.timers.get(message.guild.id))
      
      return player.pause(false)
    }

    if (!await message.client.configDB.get247(message.guild.id))
      message.client.timers.set(message.guild.id, setTimeout(() => {
        if(player) player.destroy()
      }, 1200000))

    player.pause(true)
  }
}