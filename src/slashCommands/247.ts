import { Command } from '../SlashCommandManager'
import Utils, { ErrorMessageType } from '../Utils'

export default new Command({
  name: '24/7',
  aliases: ['247'],
  adminOnly: true,
  premium: true,
  djOnly: false,
  execute: async function ({ guild, client, respond }) {
    if (!await client.db.get247(guild.id)) {
      client.db.set247(true, guild.id).then(() => respond({
        embeds: [Utils.generateErrorMessage('Режим 24/7 включён.', ErrorMessageType.NoTitle)],
        ephemeral: true
      }))

      const timer = client.timers.get(guild.id)
      if (timer)
        clearTimeout(timer)
    } else {
      client.db.set247(false, guild.id).then(() => respond({
        embeds: [Utils.generateErrorMessage('Режим 24/7 выключен.', ErrorMessageType.NoTitle)],
        ephemeral: true
      }))
      const player = client.manager.get(guild.id)
      if (player)
        if (player.paused || player.queue.length == 0)
          client.timers.set(guild.id, Utils.getExitTimeout(player, client))
    }
  }
})
