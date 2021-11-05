import generateErrorMessage from '../tools/generateErrorMessage'

export default {
  name: 'shuffle',
  aliases: ['sh'],
  djOnly: true,
  premium: true,
  cooldown: 3,
  execute: async function({ guild, voice, client, respond }) {
    const player = client.manager.get(guild.id)
    if (!player) return respond({ embeds: [generateErrorMessage('Сейчас ничего не играет.')], ephemeral: true })

    if (!voice) return respond({ embeds: [generateErrorMessage('Необходимо находиться в голосовом канале.')], ephemeral: true })

    if (!player.queue.current) return respond({embeds: [generateErrorMessage('Очередь пуста.')], ephemeral: true })

    player.queue.shuffle()
    respond({embeds: [generateErrorMessage('🔀 Очередь перемешана.', 'notitle')]})
  }
}