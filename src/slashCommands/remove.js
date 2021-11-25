import generateErrorMessage from '../tools/generateErrorMessage'

export default {
  name: 'remove',
  aliases: ['r'],
  djOnly: true,
  execute: async function({ guild, voice, client, args, respond }) {
    const player = client.manager.get(guild.id)
    if (!player) return respond({ embeds: [generateErrorMessage('Сейчас ничего не играет.')], ephemeral: true })

    if (!voice) return respond({ embeds: [generateErrorMessage('Необходимо находиться в голосовом канале.')], ephemeral: true })

    const queue = player.queue

    let removedTracks = []

    const a = args[0]

    if (a.includes('-')) {
      const first = parseInt(a.split('-')[0])
      const last = parseInt(a.split('-')[1])
      if (last && first && last > first) removedTracks = [...removedTracks, ...queue.remove(first-1, last)]
    } else {
      const inta = parseInt(a)
      if (inta >= 1) removedTracks = [...removedTracks, ...queue.remove(inta-1)]
    }

    respond({embeds: [generateErrorMessage(`🗑️ Удалено треков: ${removedTracks.length}.`, 'notitle')]})
  }
}