import generateErrorMessage from '../tools/generateErrorMessage'

export default {
  name: 'pause',
  aliases: ['ps', 'resume'],
  djOnly: true,
  execute: async function({ guild, voice, client, send, respond }) {
    const player = client.manager.get(guild.id)
    if (!player) return respond({ embeds: [generateErrorMessage('Сейчас ничего не играет.')], ephemeral: true })

    if (!voice) return respond({ embeds: [generateErrorMessage('Необходимо находиться в голосовом канале.')], ephemeral: true })
    //if (channel.id !== player.voiceChannel) return message.reply("вы находитесь не в том голосовом канале.")

    if (player.paused) {
      if (client.timers.has(guild.id))
        clearTimeout(client.timers.get(guild.id))
      
      respond({ embeds: [generateErrorMessage('▶️ Пауза снята.', 'notitle')]})

      return player.pause(false)
    }

    if (!await client.db.get247(guild.id))
      client.timers.set(guild.id, setTimeout(() => {
        send({embeds: [{
          description: '**Я покинул канал, так как слишком долго был неактивен.**\n Хотите, чтобы я оставался? Включите режим 24/7 (доступен только для Премиум пользователей, подробности: `-vdonate`). ',
          color: 0x5181b8
        }]}, 30000)
        if(player) player.destroy()
      }, 1200000))

    respond({ embeds: [generateErrorMessage('⏸️ Пауза поставлена.', 'notitle')]})

    return player.pause(true)
  }
}