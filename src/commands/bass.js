const levels = {
  none: 0.0,
  low: 0.10,
  medium: 0.15,
  high: 0.25,
}

export default {
  name: "bass",
  djOnly: true,
  premium: true,
  execute: (message, args) => {
    const player = message.client.manager.get(message.guild.id);
    if (!player) return message.reply("сейчас ничего не играет.")

    const { channel } = message.member.voice;
    
    if (!channel) return message.reply('необходимо находиться в голосовом канале.')
    if (channel.id !== player.voiceChannel) return message.reply("вы находитесь не в том голосовом канале.")

    let level = "none"
    if (args.length && args[0].toLowerCase() in levels) level = args[0].toLowerCase()

    const bands = new Array(3)
      .fill(null)
      .map((_, i) =>
        ({ band: i, gain: levels[level] })
      );

    player.setEQ(...bands)

    return message.reply(`уровень бас буста выставлен на \`${level}\`. Доступные уровни: \`none\`, \`low\`, \`medium\`, \`high\``)
  }
}