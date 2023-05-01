import { searchCommandHandler } from '../../helpers/searchCommandHelper.js'
import { CommandCustomInteraction } from '../commandInteractions.js'

export const interaction: CommandCustomInteraction = {
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
}
