import {Command} from '../SlashCommandManager'
import Utils, {ErrorMessageType} from '../Utils'

export default new Command({
  name: 'repeat',
  aliases: ['l', 'rp', 'loop'],
  djOnly: true,
  adminOnly: false,
  premium: false,
  execute: async function({ guild, voice, client, args, respond }) {
    const player = client.manager.get(guild.id)
    if (!player) return respond({ embeds: [Utils.generateErrorMessage('Сейчас ничего не играет.')], ephemeral: true })

    if (!voice) return respond({ embeds: [Utils.generateErrorMessage('Необходимо находиться в голосовом канале.')], ephemeral: true })

    if (args.length) {
      if (args[0] === 'очередь') {
        player.setQueueRepeat(true)
        respond({ embeds: [Utils.generateErrorMessage('🔁 Включен повтор очереди.', ErrorMessageType.NoTitle)] })
        return
      }
      if (args[0] === 'трек') {
        player.setTrackRepeat(true)
        respond({ embeds: [Utils.generateErrorMessage('🔁 Включен повтор трека.', ErrorMessageType.NoTitle)] })
        return
      }
      if (args[0] === 'выкл') {
        player.setQueueRepeat(false)
        player.setTrackRepeat(false)
        respond({ embeds: [Utils.generateErrorMessage('🔁 Повтор выключен.', ErrorMessageType.NoTitle)] })
        return
      }
    }

    let msg
    if (player.trackRepeat) msg = 'Повтор текущего трека'
    else if (player.queueRepeat) msg = 'Повтор очереди'

    if (msg)
      respond({ embeds: [Utils.generateErrorMessage(`🔁 ${msg} сейчас включен. Доступные режимы: \`очередь\`, \`трек\`, \`выкл\``, ErrorMessageType.NoTitle)]})
    else
      respond({ embeds: [Utils.generateErrorMessage('🔁 Повтор сейчас выключен. Доступные режимы: `очередь`, `трек`, `выкл`', ErrorMessageType.NoTitle)]})
  }
})
