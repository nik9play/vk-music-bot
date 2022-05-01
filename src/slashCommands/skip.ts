import { Command } from '../SlashCommandManager'
import Utils from '../Utils'

export default new Command({
  name: 'skip',
  aliases: ['n'],
  djOnly: true,
  adminOnly: false,
  premium: false,
  cooldown: 1,
  execute: async ({ client, guild, voice, respond }) => {
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

    const { title, author } = player.queue.current

    player.stop()
    return respond({
      embeds: [{
        description: `**${Utils.escapeFormat(author)} — ${Utils.escapeFormat(title)}** пропущен.`,
        color: 0x5181b8
      }]
    }, 20000)
  }
})