import Utils, { ErrorMessageType } from '../Utils'
import { Command } from '../SlashCommandManager'

export default new Command({
  name: 'mashup',
  djOnly: true,
  premium: false,
  adminOnly: false,
  cooldown: 1,
  execute: async ({ respond }) => {
    await respond({ embeds: [Utils.generateErrorMessage('Скоро™...', ErrorMessageType.NoTitle)] })
  }
})