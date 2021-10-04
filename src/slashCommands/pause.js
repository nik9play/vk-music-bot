import generateErrorMessage from '../tools/generateErrorMessage'
import getExitTimeout from '../tools/getExitTimeout'

export default {
  name: 'pause',
  aliases: ['ps', 'resume'],
  djOnly: true,
  execute: async function({ guild, voice, client, respond }) {
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
      client.timers.set(guild.id, getExitTimeout(player, client))

    respond({ embeds: [generateErrorMessage('⏸️ Пауза поставлена.', 'notitle')]})

    return player.pause(true)
  }
}