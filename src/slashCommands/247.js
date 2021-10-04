import generateErrorMessage from '../tools/generateErrorMessage'
import getExitTimeout from '../tools/getExitTimeout'

export default {
  name: '24/7',
  aliases: ['247'],
  adminOnly: true,
  premium: true,
  execute: async function({ guild, client, respond }) {
    const player = client.manager.get(guild.id)

    if (!await client.db.get247(guild.id)) {
      client.db.set247(true, guild.id).then(() => respond({ embeds: [generateErrorMessage('Режим 24/7 включён.', 'notitle')], ephemeral: true }))
      if (client.timers.has(guild.id))
        clearTimeout(client.timers.get(guild.id))
    } else {
      client.db.set247(false, guild.id).then(() => respond({ embeds: [generateErrorMessage('Режим 24/7 выключён.', 'notitle')], ephemeral: true }))
      if (player)
        if (player.paused || player.queue.length == 0)
          client.timers.set(guild.id, getExitTimeout(player, client))
    }
  }
}