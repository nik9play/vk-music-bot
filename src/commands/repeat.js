export default {
  name: "repeat",
  aliases: ["l", "rp"],
  djOnly: true,
  execute: async function(message, args) {
    const player = message.client.manager.get(message.guild.id)
    if (!player) return message.reply("сейчас ничего не играет.")

    const { channel } = message.member.voice
    
    if (!channel) return message.reply('необходимо находиться в голосовом канале.')
    if (channel.id !== player.voiceChannel) return message.reply("вы находитесь не в том голосовом канале.")

    if (args.length && /queue/i.test(args[0])) {
      player.setQueueRepeat(!player.queueRepeat)
      const queueRepeat = player.queueRepeat ? "включен" : "отключен"
      return message.reply(`${queueRepeat} повтор очереди.`)
    }

    player.setTrackRepeat(!player.trackRepeat);
    const trackRepeat = player.trackRepeat ? "включен" : "отключен";
    return message.reply(`${trackRepeat} повтор трека.`)
  }
}