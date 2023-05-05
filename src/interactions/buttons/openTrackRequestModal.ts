import {
  ActionRowBuilder,
  ModalActionRowComponentBuilder,
  ModalBuilder,
  TextInputBuilder,
  TextInputStyle
} from 'discord.js'
import { ButtonCustomInteraction } from '../buttonInteractions.js'

export const interaction: ButtonCustomInteraction = {
  name: 'openTrackRequestModal',
  execute: async ({ interaction }) => {
    const components = [
      new ActionRowBuilder<ModalActionRowComponentBuilder>().addComponents(
        new TextInputBuilder()
          .setCustomId('trackRequest')
          .setLabel('Запрос')
          .setStyle(TextInputStyle.Short)
          .setMinLength(3)
          .setMaxLength(255)
          .setRequired(true)
          .setPlaceholder('Название / ссылка / ID трека / >ID пользователя')
      ),
      new ActionRowBuilder<ModalActionRowComponentBuilder>().addComponents(
        new TextInputBuilder()
          .setCustomId('count')
          .setLabel('Количество')
          .setStyle(TextInputStyle.Short)
          .setPlaceholder('50')
          .setRequired(false)
      ),
      new ActionRowBuilder<ModalActionRowComponentBuilder>().addComponents(
        new TextInputBuilder()
          .setCustomId('offset')
          .setLabel('Отступ')
          .setStyle(TextInputStyle.Short)
          .setPlaceholder('0')
          .setRequired(false)
      )
    ]
    // logger.debug(components.toJSON())
    const modal = new ModalBuilder()
      .setCustomId('trackRequestModal')
      .setTitle('Добавление в очередь')
      .addComponents(components)

    await interaction.showModal(modal)
  }
}
