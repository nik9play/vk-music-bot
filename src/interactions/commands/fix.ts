import Utils, { ErrorMessageType } from '../../utils.js'
import { CommandCustomInteraction } from '../commandInteractions.js'

export const interaction: CommandCustomInteraction = {
  name: 'fix',
  djOnly: true,
  cooldown: 5,
  adminOnly: false,
  premium: false,
  execute: async ({ client, respond, guild }) => {
    const player = client.playerManager.get(guild.id)

    Utils.clearExitTimeout(guild.id, client)

    await player?.safeDestroy()

    await respond({
      embeds: [Utils.generateErrorMessage('🔧', ErrorMessageType.NoTitle)]
    })
  }
}
