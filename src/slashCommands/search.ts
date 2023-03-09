import { Command } from '../slashCommandManager.js'
import { searchCommandHandler } from '../helpers/searchCommandHelper.js'

export default new Command({
  name: 'search',
  djOnly: true,
  cooldown: 5,
  premium: false,
  adminOnly: false,
  deferred: true,
  execute: async function (params) {
    const search = params.interaction.options.getString('запрос') as string

    await searchCommandHandler(params, search)
  }
})
