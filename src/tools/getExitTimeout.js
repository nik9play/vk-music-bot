import logger from './logger'

export default function(player, client) {
  return setTimeout(async () => {
    if (player) {
      logger.log('info', `Exit timeout setted ${player.guild}`)

      player.destroy()
      const channel = client.channels.cache.get(player.textChannel)
      if (channel) {
        const message = await channel.send({embeds: [{
          description: `**Я покинул канал, так как слишком долго был неактивен.**\n Хотите, чтобы я оставался? Включите режим 24/7 (доступен только для Премиум пользователей, подробности: \`${await client.db.getPrefix(player.guild)}donate\`). `,
          color: 0x5181b8
        }]}).catch(err => logger.log('error', 'Can\'t send message: %O', err))

        setTimeout(() => {
          if (message && typeof message.delete === 'function') {
            message.delete().catch(err => logger.log('error', 'Can\'t delete message: %O', err))
          }
        }, 30000)
      }
    }
  }, 1200000)
}