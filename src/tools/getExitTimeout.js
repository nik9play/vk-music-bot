export default function(player, client) {
  return setTimeout(async () => {
    if (player) {
      console.log('Exit timeout setted')

      player.destroy()
      const channel = client.channels.cache.get(player.textChannel)
      const message = await channel.send({embeds: [{
        description: `**Я покинул канал, так как слишком долго был неактивен.**\n Хотите, чтобы я оставался? Включите режим 24/7 (доступен только для Премиум пользователей, подробности: \`${await client.db.getPrefix(player.guild)}donate\`). `,
        color: 0x5181b8
      }]}).catch(err => console.error('Can\'t send message: ', err))

      setTimeout(() => {
        message.delete().catch(err => console.error('Can\'t delete message:', err))
      }, 30000)
    }
  }, 1200000)
}