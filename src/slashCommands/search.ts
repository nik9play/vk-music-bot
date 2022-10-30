import { Command } from '../SlashCommandManager.js'
import { searchCommand } from '../helpers/SearchCommandHelper.js'

export default new Command({
  name: 'search',
  djOnly: true,
  cooldown: 5,
  premium: false,
  adminOnly: false,
  deferred: true,
  execute: async function (params) {
    const search = params.interaction.options.getString('запрос') as string

    await searchCommand(params, search)
  }
})
