export default {
  name: "shuffle",
  aliases: ["sh"],
  djOnly: true,
  premium: true,
  cooldown: 3,
  execute: async function(message) {
    const player = message.client.manager.get(message.guild.id);
    if (!player) return message.reply("сейчас ничего не играет.")

    const { channel } = message.member.voice

    if (!channel) return message.reply('необходимо находиться в голосовом канале.')
    //if (channel.id !== player.voiceChannel) return message.reply("вы находитесь не в том голосовом канале.")

    if (!player.queue.current) return message.reply("очередь пуста.")

    player.queue.shuffle()
    message.reply("очередь перемешана.")
  }
}