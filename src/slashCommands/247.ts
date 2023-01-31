import { getConfig, updateConfig } from '../db.js'
import CustomPlayer from '../kazagumo/CustomPlayer.js'
import { Command } from '../slashCommandManager.js'
import Utils, { ErrorMessageType } from '../utils.js'

export default new Command({
  name: '24/7',
  aliases: ['247'],
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

      const timer = client.timers.get(guild.id)
      if (timer) clearTimeout(timer)
    } else {
      await updateConfig(guild.id, { enable247: false })
      await respond({
        embeds: [Utils.generateErrorMessage('Режим 24/7 выключен.', ErrorMessageType.NoTitle)],
        ephemeral: true
      })
      const player = client.kazagumo.getPlayer<CustomPlayer>(guild.id)
      if (player)
        if (player.paused || player.queue.length == 0) client.timers.set(guild.id, Utils.getExitTimeout(player, client))
    }
  }
})
