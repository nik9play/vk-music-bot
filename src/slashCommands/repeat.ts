import { Command } from '../modules/slashCommandManager.js'
import Utils, { ErrorMessageType } from '../utils.js'

export default new Command({
  name: 'repeat',
  aliases: ['l', 'rp', 'loop'],
  djOnly: true,
  adminOnly: false,
  premium: false,
  execute: async function ({ guild, voice, client, interaction, respond }) {
    const player = client.queue.get(guild.id)
    if (!player) {
      await Utils.sendNoPlayerMessage(respond)
      return
    }

    if (!voice) {
      await Utils.sendNoVoiceChannelMessage(respond)
      return
    }

    const repeatParam = interaction.options.getString('режим')

    if (repeatParam) {
      if (repeatParam === 'очередь') {
        player.repeat = 'queue'
        await respond({
          embeds: [Utils.generateErrorMessage('🔁 Включен повтор очереди.', ErrorMessageType.NoTitle)]
        })
        return
      }
      if (repeatParam === 'трек') {
        player.repeat = 'track'
        await respond({
          embeds: [Utils.generateErrorMessage('🔁 Включен повтор трека.', ErrorMessageType.NoTitle)]
        })
        return
      }
      if (repeatParam === 'выкл') {
        player.repeat = 'none'
        await respond({
          embeds: [Utils.generateErrorMessage('🔁 Повтор выключен.', ErrorMessageType.NoTitle)]
        })
        return
      }
    }

    let msg
    if (player.repeat === 'track') msg = 'Повтор текущего трека'
    if (player.repeat === 'queue') msg = 'Повтор очереди'

    if (msg)
      await respond({
        embeds: [
          Utils.generateErrorMessage(
            `🔁 ${msg} сейчас включен. Доступные режимы: \`очередь\`, \`трек\`, \`выкл\``,
            ErrorMessageType.NoTitle
          )
        ]
      })
    else
      await respond({
        embeds: [
          Utils.generateErrorMessage(
            '🔁 Повтор сейчас выключен. Доступные режимы: `очередь`, `трек`, `выкл`',
            ErrorMessageType.NoTitle
          )
        ]
      })
  }
})
