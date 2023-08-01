import {
  ActionRowBuilder,
  ModalActionRowComponentBuilder,
  ModalBuilder,
  PermissionsBitField,
  TextInputBuilder,
  TextInputStyle
} from 'discord.js'
import { ButtonCustomInteraction } from '../buttonInteractions.js'
import Utils from '../../utils.js'
import { getConfig } from '../../db.js'

export const interaction: ButtonCustomInteraction = {
  name: 'openTrackRequestModal',
  djOnly: true,
  execute: async ({ interaction, voice, respond, guild }) => {
    if (!voice) {
      await Utils.sendNoVoiceChannelMessage(respond)
      return
    }

    const config = await getConfig(guild.id)

    if (config.djMode) {
      const djRole = config.djRoleName

      if (
        !interaction.member.permissions.has(PermissionsBitField.Flags.ManageGuild) &&
        !interaction.member.roles.cache.some((role) => role.name === djRole)
      ) {
        await respond({
          embeds: [
            Utils.generateErrorMessage(
              `Сейчас включен DJ режим, и вы не можете использовать кнопки, так как у вас нет роли \`${djRole}\`.`
            )
          ],
          ephemeral: true
        })
        return
      }
    }

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
