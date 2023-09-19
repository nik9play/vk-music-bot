import { SlashCommandBuilder } from 'discord.js'
import { CommandCustomInteraction } from '../commandInteractions.js'
import Utils, { ErrorMessageType } from '../../utils.js'
import Denque from 'denque'

function moveElement(arr: Denque, oldIndex: number, newIndex: number) {
  let numberOfDeletedElm = 1

  const elm = arr.splice(oldIndex, numberOfDeletedElm)![0]

  numberOfDeletedElm = 0

  arr.splice(newIndex, numberOfDeletedElm, elm)
}

export const interaction: CommandCustomInteraction = {
  name: 'move',
  djOnly: true,
  data: new SlashCommandBuilder()
    .setName('move')
    .setDescription('Переместить трек в очереди на другую позицию')
    .setDMPermission(false)
    .addIntegerOption((option) =>
      option
        .setName('старая-позиция')
        .setDescription('Старая позиция трека')
        .setMinValue(1)
        .setMaxValue(20_000)
    )
    .addIntegerOption((option) =>
      option
        .setName('новая-позиция')
        .setDescription('Новая позиция трека')
        .setMinValue(1)
        .setMaxValue(20_000)
    )
    .setDMPermission(false),
  execute: async ({ respond, interaction, client, guild }) => {
    const player = client.playerManager.get(guild.id)

    if (!Utils.checkPlayer(respond, player)) return
    if (!Utils.checkQueue(respond, player)) return

    const oldIndex = interaction.options.getInteger('старая-позиция', true) - 1
    const newIndex = interaction.options.getInteger('новая-позиция', true) - 1

    if (oldIndex + 1 > player.queue.length || newIndex + 1 > player.queue.length) {
      await respond({
        embeds: [Utils.generateErrorMessage('Какое-то из значений больше размера очереди.')]
      })
      return
    }

    moveElement(player.queue, oldIndex, newIndex)

    await respond({
      embeds: [
        Utils.generateErrorMessage(
          `🔀 Трек **${player.queue.peekAt(newIndex)!.author} – ${
            player.queue.peekAt(newIndex)!.title
          }** был перемещен с позиции **${oldIndex + 1}** на позицию **${newIndex + 1}**.`,
          ErrorMessageType.NoTitle
        )
      ]
    })
  }
}
