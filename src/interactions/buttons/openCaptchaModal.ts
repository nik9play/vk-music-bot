import { ActionRowBuilder, ModalActionRowComponentBuilder, TextInputBuilder } from '@discordjs/builders'
import { ModalBuilder, TextInputStyle } from 'discord.js'
import { ButtonCustomInteraction } from '../buttonInteractions.js'

export const interaction: ButtonCustomInteraction = {
  name: 'openCaptchaModel',
  execute: async ({ interaction }) => {
    const components = new ActionRowBuilder<ModalActionRowComponentBuilder>().addComponents(
      new TextInputBuilder()
        .setCustomId('captchaKey')
        .setLabel('dsfgsdfg')
        .setStyle(TextInputStyle.Short)
        .setMinLength(4)
        .setMaxLength(7)
        .setRequired(true)
        .setPlaceholder('fgd')
    )
    console.log(components.toJSON())
    const modal = new ModalBuilder().setCustomId('captchaModal').setTitle('sdf').addComponents([components])

    await interaction.showModal(modal)
  }
}
