import { skipCommand } from '../helpers/skipCommandHelper.js'
import { Command } from '../slashCommandManager.js'

export default new Command({
  name: 'skip',
  aliases: ['n'],
  djOnly: true,
  adminOnly: false,
  premium: false,
  cooldown: 1,
  execute: async (params) => {
    const skipCount = params.interaction.options.getInteger('количество')

    await skipCommand(params, skipCount)
  }
})
