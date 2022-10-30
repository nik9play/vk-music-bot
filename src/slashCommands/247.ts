import { Command } from '../SlashCommandManager.js'
import Utils, { ErrorMessageType } from '../Utils.js'

export default new Command({
  name: '24/7',
  aliases: ['247'],
  adminOnly: true,
  premium: true,
  djOnly: false,
  execute: async function ({ guild, client, respond }) {
    if (!(await client.db.get247(guild.id))) {
      await client.db.set247(true, guild.id)
      await respond({
        embeds: [Utils.generateErrorMessage('Режим 24/7 включён.', ErrorMessageType.NoTitle)],
        ephemeral: true
      })

      const timer = client.timers.get(guild.id)
      if (timer) clearTimeout(timer)
    } else {
      await client.db.set247(false, guild.id)
      await respond({
        embeds: [Utils.generateErrorMessage('Режим 24/7 выключен.', ErrorMessageType.NoTitle)],
        ephemeral: true
      })
      const player = client.manager.get(guild.id)
      if (player)
        if (player.paused || player.queue.length == 0) client.timers.set(guild.id, Utils.getExitTimeout(player, client))
    }
  }
})
