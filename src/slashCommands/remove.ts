import { Command } from '../slashCommandManager.js'
import Utils, { ErrorMessageType } from '../utils.js'
import CustomPlayer from '../kagazumo/CustomPlayer.js'
import { KazagumoTrack } from 'kazagumo'

export default new Command({
  name: 'remove',
  aliases: ['r'],
  djOnly: true,
  adminOnly: false,
  premium: false,
  execute: async function ({ guild, voice, client, interaction, respond }) {
    const player = client.kagazumo.getPlayer<CustomPlayer>(guild.id)
    if (!player) {
      await respond({
        embeds: [Utils.generateErrorMessage('Сейчас ничего не играет.')],
        ephemeral: true
      })
      return
    }

    if (!voice) {
      await respond({
        embeds: [Utils.generateErrorMessage('Необходимо находиться в голосовом канале.')],
        ephemeral: true
      })
      return
    }

    const queue = player.queue
    const beforeRemove = player.queue.size

    let removedTracks = 0

    const arg = interaction.options.getString('треки', true)

    if (arg.includes('-')) {
      const first = parseInt(arg.split('-')[0])
      const last = parseInt(arg.split('-')[1])

      queue.splice(first - 1, last - first + 1)

      const afterRemove = player.queue.size
      if (last && first && last > first) removedTracks = beforeRemove - afterRemove
    } else {
      const intArg = parseInt(arg)
      queue.remove(intArg - 1)
      const afterRemove = player.queue.size

      if (intArg >= 1) removedTracks = beforeRemove - afterRemove
    }

    await respond({
      embeds: [Utils.generateErrorMessage(`🗑️ Удалено треков: ${removedTracks}.`, ErrorMessageType.NoTitle)]
    })
  }
})
