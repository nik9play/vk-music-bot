import generateErrorMessage from '../tools/generateErrorMessage';

export default {
  name: 'skip',
  aliases: ['n'],
  djOnly: true,
  cooldown: 1,
  execute: async ({ client, guild, voice, respond }) => { 
    const player = client.manager.get(guild.id)
    if (!player) return respond({embeds: [generateErrorMessage('Сейчас ничего не играет.')], ephemeral: true })

    if (!voice) return respond({ embeds: [generateErrorMessage('Необходимо находиться в голосовом канале.')], ephemeral: true })

    if (!player.queue.current) return respond({ embeds: [generateErrorMessage('Очередь пуста.')], ephemeral: true })

    const { title, author } = player.queue.current

    player.stop()
    return respond({embeds: [{
      description: `**${author} — ${title}** пропущен.`,
      color: 0x5181b8
    }]}, 20000)
  }
}