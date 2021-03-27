export default {
  name: "skip",
  aliases: ["n"],
  djOnly: true,
  cooldown: 1,
  execute: async (message) => { 
    const player = message.client.manager.get(message.guild.id);
    if (!player) return message.reply("сейчас ничего не играет.")

    const { channel } = message.member.voice

    if (!channel) return message.reply('необходимо находиться в голосовом канале.')
    if (channel.id !== player.voiceChannel) return message.reply("вы находитесь не в том голосовом канале.")

    if (!player.queue.current) return message.reply("очередь пуста.")

    const { title, author } = player.queue.current

    player.stop()
    return message.channel.send({embed: {
      description: `**${author} — ${title}** пропущен.`,
      color: 0x5181b8
    }}).then(msg => msg.delete({timeout: 20000}))
  }
}