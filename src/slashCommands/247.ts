import { getConfig, updateConfig } from '../db.js'
import { Command } from '../modules/slashCommandManager.js'
import Utils, { ErrorMessageType } from '../utils.js'

export default new Command({
  name: '247',
  adminOnly: true,
  premium: true,
  djOnly: false,
  execute: async function ({ guild, client, respond }) {
    const config = await getConfig(guild.id)

    if (!config.enable247) {
      await updateConfig(guild.id, { enable247: true })
      await respond({
        embeds: [Utils.generateErrorMessage('Режим 24/7 включён.', ErrorMessageType.NoTitle)],
        ephemeral: true
      })

      Utils.clearExitTimeout(guild.id, client)
    } else {
      await updateConfig(guild.id, { enable247: false })
      await respond({
        embeds: [Utils.generateErrorMessage('Режим 24/7 выключен.', ErrorMessageType.NoTitle)],
        ephemeral: true
      })
      const player = client.queue.get(guild.id)
      if (player)
        if (player.player.paused || (player.queue.length === 0 && !player.current)) Utils.setExitTimeout(player, client)
    }
  }
})
