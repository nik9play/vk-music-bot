import { Command } from '../SlashCommandManager'
import Utils, { ErrorMessageType } from '../Utils'

export default new Command({
  name: 'shuffle',
  aliases: ['sh'],
  djOnly: true,
  premium: true,
  adminOnly: false,
  cooldown: 3,
  execute: async function ({ guild, voice, client, respond }) {
    const player = client.manager.get(guild.id)
    if (!player) return respond({ embeds: [Utils.generateErrorMessage('Сейчас ничего не играет.')], ephemeral: true })

    if (!voice) return respond({
      embeds: [Utils.generateErrorMessage('Необходимо находиться в голосовом канале.')],
      ephemeral: true
    })

    if (!player.queue.current) return respond({
      embeds: [Utils.generateErrorMessage('Очередь пуста.')],
      ephemeral: true
    })

    player.queue.shuffle()
    await respond({ embeds: [Utils.generateErrorMessage('🔀 Очередь перемешана.', ErrorMessageType.NoTitle)] })
  }
})