export default {
  name: "24/7",
  aliases: ["247"],
  adminOnly: true,
  execute: async function(message) {
    const player = message.client.manager.get(message.guild.id)

    if (!await message.client.configDB.get247(message.guild.id)) {
      message.client.configDB.set247(true, message.guild.id).then(() => message.reply("<:yes:806179743766413323> режим 24/7 включен."))
      if (message.client.timers.has(message.guild.id))
        clearTimeout(message.client.timers.get(message.guild.id))
    } else {
      message.client.configDB.set247(false, message.guild.id).then(() => message.reply("<:no:806178831994978385> режим 24/7 выключен."))
      if (player)
        if (player.paused || player.queue.length == 0)
          message.client.timers.set(message.guild.id, setTimeout(() => {
            if(player) player.destroy()
            message.channel.send({embed: {
              description: `**Я покинул канал, так как слишком долго был неактивен.** Хотите, чтобы я оставался? Включите режим 24/7 (доступен только для Премиум пользователей). `,
              color: 0x5181b8
            }}).then(msg => setTimeout(() => msg.delete(), 30000))
          }, 1200000))
    }
  }
}