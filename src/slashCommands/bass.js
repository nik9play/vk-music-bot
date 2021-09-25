import generateErrorMessage from '../tools/generateErrorMessage'

const levels = {
  'выкл': 0.0,
  'слабый': 0.15,
  'средний': 0.25,
  'мощный': 0.35,
}

export default {
  name: 'bass',
  premium: true,
  execute: async function ({ respond, client, guild, voice, args }) {
    const player = client.manager.get(guild.id)
    if (!player) return respond({ embeds: [generateErrorMessage('Сейчас ничего не играет.')], ephemeral: true })
    
    if (!voice) return respond({ embeds: [generateErrorMessage('Необходимо находиться в голосовом канале.')], ephemeral: true })
    //if (channel.id !== player.voiceChannel) return message.reply("вы находитесь не в том голосовом канале.")

    let level = null
    if (args.length && args[0].toLowerCase() in levels) level = args[0].toLowerCase()

    if (level && level in levels) {
      const bands = new Array(3)
      .fill(null)
      .map((_, i) =>
        ({ band: i, gain: levels[level] })
      )

      player.setEQ(...bands)

      respond({embeds: [generateErrorMessage(`🔈 Уровень бас буста выставлен на \`${level}\`.\nДоступные уровни: \`выкл\`, \`слабый\`, \`средний\`, \`мощный\``, 'notitle')]})
    } else {
      respond({embeds: [generateErrorMessage('🔈 Доступные уровни: `выкл`, `слабый`, `средний`, `мощный`')]})
    }



    //return message.reply(`🔈 Уровень бас буста выставлен на \`${level}\`. Доступные уровни: \`none\`, \`low\`, \`medium\`, \`high\``)
  }
}