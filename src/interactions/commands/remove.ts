import { SlashCommandBuilder } from 'discord.js'
import Utils, { ErrorMessageType } from '../../utils.js'
import { CommandCustomInteraction } from '../commandInteractions.js'

export const interaction: CommandCustomInteraction = {
  name: 'remove',
  djOnly: true,
  data: new SlashCommandBuilder()
    .setName('remove')
    .setDescription('Удаление треков из очереди')
    .addStringOption((option) =>
      option
        .setName('треки')
        .setDescription('Номер трека или треков в формате 1-5')
        .setRequired(true)
    )
    .setDMPermission(false),
  execute: async function ({ guild, voice, client, interaction, respond }) {
    const player = client.playerManager.get(guild.id)

    if (!Utils.checkPlayer(respond, player)) return
    if (!Utils.checkSameVoiceChannel(respond, voice)) return

    const queue = player.queue
    const beforeRemove = player.queue.length

    let removedTracks = 0

    const arg = interaction.options.getString('треки', true)

    if (/\d+-\d+/.test(arg)) {
      const first = parseInt(arg.split('-')[0])
      const last = parseInt(arg.split('-')[1])

      if (first >= last) {
        await respond({
          embeds: [Utils.generateErrorMessage(`Неверный диапазон.`)]
        })
        return
      }

      let index = first - 1
      let count = last - first + 1

      if (index === 0) {
        index = 1
        count--
      }

      queue.remove(index, count)

      const afterRemove = player.queue.length
      if (last && first && last > first) removedTracks = beforeRemove - afterRemove
    } else {
      const position = parseInt(arg)

      if (isNaN(position)) {
        await respond({
          embeds: [Utils.generateErrorMessage(`Неверный номер.`)]
        })
        return
      }

      queue.removeOne(position - 1)
      const afterRemove = player.queue.length

      if (position >= 1) removedTracks = beforeRemove - afterRemove
    }

    await respond({
      embeds: [
        Utils.generateErrorMessage(`🗑️ Удалено треков: ${removedTracks}.`, ErrorMessageType.NoTitle)
      ]
    })
  }
}
