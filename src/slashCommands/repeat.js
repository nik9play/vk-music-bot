import generateErrorMessage from '../tools/generateErrorMessage'

export default {
  name: 'repeat',
  aliases: ['l', 'rp', 'loop'],
  djOnly: true,
  execute: async function({ guild, voice, client, args, respond }) {
    const player = client.manager.get(guild.id)
    if (!player) return respond({ embeds: [generateErrorMessage('Сейчас ничего не играет.')], ephemeral: true })

    if (!voice) return respond({ embeds: [generateErrorMessage('Необходимо находиться в голосовом канале.')], ephemeral: true })

    if (args.length) {
      if (args[0] === 'очередь') {
        player.setQueueRepeat(true)
        respond({ embeds: [generateErrorMessage('🔁 Включен повтор очереди.', 'notitle')] })
        return
      }
      if (args[0] === 'трек') {
        player.setTrackRepeat(true)
        respond({ embeds: [generateErrorMessage('🔁 Включен повтор очереди.', 'notitle')] })
        return
      }
      if (args[0] === 'выкл') {
        player.setQueueRepeat(false)
        player.setTrackRepeat(false)
        respond({ embeds: [generateErrorMessage('🔁 Повтор выключен.', 'notitle')] })
        return
      }
    }

    let msg
    if (player.trackRepeat) msg = 'Повтор текущего трека'
    else if (player.queueRepeat) msg = 'Повтор очереди'

    if (msg)
      respond({ embeds: [generateErrorMessage(`🔁 ${msg} сейчас включен. Доступные режимы: \`очередь\`, \`трек\`, \`выкл\``, 'notitle')]})
    else
      respond({ embeds: [generateErrorMessage('🔁 Повтор сейчас выключен. Доступные режимы: `очередь`, `трек`, `выкл`', 'notitle')]})
  }
}