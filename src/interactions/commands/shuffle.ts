import Utils, { ErrorMessageType } from '../../utils.js'
import { CommandCustomInteraction } from '../commandInteractions.js'

export const interaction: CommandCustomInteraction = {
  name: 'shuffle',
  aliases: ['sh'],
  djOnly: true,
  premium: true,
  adminOnly: false,
  cooldown: 3,
  execute: async function ({ guild, voice, client, respond }) {
    const player = client.playerManager.get(guild.id)
    if (!player) {
      await Utils.sendNoPlayerMessage(respond)
      return
    }

    if (!voice) {
      await Utils.sendNoVoiceChannelMessage(respond)
      return
    }

    if (player.queue.length === 0) {
      await Utils.sendNoQueueMessage(respond)
      return
    }

    player.shuffle()

    await respond({
      embeds: [Utils.generateErrorMessage('🔀 Очередь перемешана.', ErrorMessageType.NoTitle)]
    })
  }
}
