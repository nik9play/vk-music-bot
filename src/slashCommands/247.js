export default {
  name: '24/7',
  aliases: ['247'],
  adminOnly: true,
  premium: true,
  execute: async function({ guild, client, respond, send }) {
    const player = client.manager.get(guild.id)

    if (!await client.db.get247(guild.id)) {
      client.db.set247(true, guild.id).then(() => respond({ embeds: [{ description: '<:yes2:835498559805063169> Режим 24/7 включён.', ephemeral: true }]}))
      if (client.timers.has(guild.id))
        clearTimeout(client.timers.get(guild.id))
    } else {
      client.db.set247(false, guild.id).then(() => respond({ embeds: [{ description: '<:no2:835498572916195368> Режим 24/7 выключён.', ephemeral: true }]}))
      if (player)
        if (player.paused || player.queue.length == 0)
          client.timers.set(guild.id, setTimeout(() => {
            if(player) player.destroy()
            send({embeds: [{
              description: '**Я покинул канал, так как слишком долго был неактивен.** Хотите, чтобы я оставался? Включите режим 24/7 (доступен только для Премиум пользователей). ',
              color: 0x5181b8
            }]}, 30000)
          }, 1200000))
    }
  }
}