import { ButtonCustomInteraction } from '../../modules/slashCommandManager.js'

//todo: проверить работу с fetch
const deleteMessage: ButtonCustomInteraction = {
  name: 'deleteMessage',
  execute: async ({ interaction }) => {
    if (interaction.message.deletable) await interaction.message.delete()
  }
}

export default deleteMessage
