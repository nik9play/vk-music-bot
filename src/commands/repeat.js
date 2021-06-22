export default {
  name: "repeat",
  aliases: ["l", "rp", "loop"],
  djOnly: true,
  execute: async function(message, args) {
    const player = message.client.manager.get(message.guild.id)
    if (!player) return message.reply("сейчас ничего не играет.")

    const { channel } = message.member.voice
    
    if (!channel) return message.reply('необходимо находиться в голосовом канале.')
    //if (channel.id !== player.voiceChannel) return message.reply("вы находитесь не в том голосовом канале.")

    if (args.length && /queue/i.test(args[0])) {
      player.setQueueRepeat(true)
      return message.reply(`включен повтор очереди.`)
    } else if (args.length && /track/i.test(args[0])) {
      player.setTrackRepeat(true)
      return message.reply(`включен повтор текущего трека.`)
    } else if (args.length && /off/i.test(args[0])) {
      player.setQueueRepeat(false)
      player.setTrackRepeat(false)
      return message.reply(`повтор выключен.`)
    } else {
      let msg
      if (player.trackRepeat) msg = "повтор текущего трека"
      else if (player.queueRepeat) msg = "повтор очереди"

      if (msg)
        message.reply(`${msg} сейчас включен. Доступные режимы: \`queue\`, \`track\`, \`off\``)
      else
        message.reply(`Режим повтора сейчас выключен. Доступные режимы: \`queue\`, \`track\`, \`off\``)
    }
  }
}