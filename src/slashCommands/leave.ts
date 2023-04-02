import { Command } from '../modules/slashCommandManager.js'
import Utils, { ErrorMessageType } from '../utils.js'

export default new Command({
  name: 'leave',
  djOnly: true,
  cooldown: 1,
  adminOnly: false,
  premium: false,
  execute: async ({ client, respond, guild, voice }) => {
    const player = client.queue.get(guild.id)

    if (!player) {
      await Utils.sendNoPlayerMessage(respond)
      return
    }

    Utils.clearExitTimeout(guild.id, client)

    await player?.safeDestroy()

    await respond({
      embeds: [Utils.generateErrorMessage('👋', ErrorMessageType.NoTitle)]
    })
  }
})
