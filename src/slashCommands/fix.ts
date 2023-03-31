import { Command } from '../modules/slashCommandManager.js'
import Utils, { ErrorMessageType } from '../utils.js'

export default new Command({
  name: 'fix',
  djOnly: true,
  cooldown: 5,
  adminOnly: false,
  premium: false,
  execute: async ({ client, respond, guild }) => {
    const player = client.queue.get(guild.id)

    Utils.clearExitTimeout(guild.id, client)

    await player?.destroy()

    await respond({
      embeds: [Utils.generateErrorMessage('🔧', ErrorMessageType.NoTitle)]
    })
  }
})
