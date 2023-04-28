import Utils, { ErrorMessageType } from '../../utils.js'
import { CommandCustomInteraction } from '../commandInteractions.js'

export const interaction: CommandCustomInteraction = {
  name: 'remove',
  aliases: ['r'],
  djOnly: true,
  adminOnly: false,
  premium: false,
  execute: async function ({ guild, voice, client, interaction, respond }) {
    const player = client.playerManager.get(guild.id)
    if (!player) {
      await Utils.sendNoPlayerMessage(respond)
      return
    }

    if (!voice) {
      await Utils.sendNoVoiceChannelMessage(respond)
      return
    }

    const queue = player.queue
    const beforeRemove = player.queue.length

    let removedTracks = 0

    const arg = interaction.options.getString('треки', true)

    if (arg.includes('-')) {
      const first = parseInt(arg.split('-')[0])
      const last = parseInt(arg.split('-')[1])

      queue.splice(first - 1, last - first + 1)

      const afterRemove = player.queue.length
      if (last && first && last > first) removedTracks = beforeRemove - afterRemove
    } else {
      const intArg = parseInt(arg)
      queue.splice(intArg - 1, 1)
      const afterRemove = player.queue.length

      if (intArg >= 1) removedTracks = beforeRemove - afterRemove
    }

    await respond({
      embeds: [Utils.generateErrorMessage(`🗑️ Удалено треков: ${removedTracks}.`, ErrorMessageType.NoTitle)]
    })
  }
}
