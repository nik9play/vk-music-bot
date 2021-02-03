export default {
  name: "stop",
  aliases: ["s"],
  djOnly: true,
  cooldown: 1,
  execute: async (message) => { 
    const player = message.client.manager.get(message.guild.id)
    if (!player) return message.reply("сейчас ничего не играет.")

    const { channel } = message.member.voice;
    
    if (!channel) return message.reply('необходимо находиться в голосовом канале.')
    if (channel.id !== player.voiceChannel) return message.reply("вы находитесь не в том голосовом канале.")
    
    player.destroy()
    return message.reply("проигрывание остановлено, очередь очищена.")
  }
}