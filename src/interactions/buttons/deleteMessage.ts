import { ButtonCustomInteraction } from '../buttonInteractions.js'

//todo: проверить работу с fetch
export const interaction: ButtonCustomInteraction = {
  name: 'deleteMessage',
  execute: async ({ interaction }) => {
    if (interaction.message.deletable) await interaction.message.delete()
  }
}
