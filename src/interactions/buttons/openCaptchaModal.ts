import { ActionRowBuilder, ModalActionRowComponentBuilder, TextInputBuilder } from '@discordjs/builders'
import { ModalBuilder, TextInputStyle } from 'discord.js'
import { ButtonCustomInteraction } from '../../modules/slashCommandManager.js'

const openCaptchaModel: ButtonCustomInteraction = {
  name: 'openCaptchaModel',
  execute: async ({ interaction }) => {
    const modal = new ModalBuilder().setCustomId('captchaModal').setTitle('Капча')

    const components = new ActionRowBuilder<ModalActionRowComponentBuilder>().addComponents(
      new TextInputBuilder()
        .setCustomId('captcha_key')
        .setLabel('Введите капчу')
        .setStyle(TextInputStyle.Short)
        .setMinLength(4)
        .setMaxLength(7)
        .setRequired(true)
        .setPlaceholder('xxxxx')
    )

    modal.addComponents(components)

    interaction.showModal(modal)
  }
}

export default openCaptchaModel
