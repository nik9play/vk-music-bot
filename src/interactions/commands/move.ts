import { SlashCommandBuilder } from 'discord.js'
import { CommandCustomInteraction } from '../commandInteractions.js'
import Utils, { ErrorMessageType } from '../../utils.js'

function moveElement(arr: any[], oldIndex: number, newIndex: number) {
  let numberOfDeletedElm = 1

  const elm = arr.splice(oldIndex, numberOfDeletedElm)[0]

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
        .setName('номер')
        .setDescription('Номер трека для перемещения')
        .setMinValue(1)
        .setMaxValue(20_000)
    )
    .addIntegerOption((option) =>
      option
        .setName('позиция')
        .setDescription('Новая позиция для трека')
        .setMinValue(1)
        .setMaxValue(20_000)
    )
    .setDMPermission(false),
  execute: async ({ respond, interaction, client, guild }) => {
    const player = client.playerManager.get(guild.id)

    if (!Utils.checkPlayer(respond, player)) return
    if (!Utils.checkQueue(respond, player)) return

    const oldIndex = interaction.options.getInteger('номер', true) - 1
    const newIndex = interaction.options.getInteger('позиция', true) - 1

    if (oldIndex + 1 > player.queue.length || newIndex + 1 > player.queue.length) {
      await respond({ embeds: [Utils.generateErrorMessage('Неверные значения.')] })
      return
    }

    moveElement(player.queue, oldIndex, newIndex)

    await respond({
      embeds: [
        Utils.generateErrorMessage(
          `🔀 Трек **${player.queue[newIndex].author} – ${
            player.queue[newIndex].title
          }** был перемещен с позиции **${oldIndex + 1}** на позицию **${newIndex + 1}**.`,
          ErrorMessageType.NoTitle
        )
      ]
    })
  }
}
