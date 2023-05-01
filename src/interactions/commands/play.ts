import { playCommandHandler } from '../../helpers/playCommandHelper.js'
import { CommandCustomInteraction } from '../commandInteractions.js'

export const interaction: CommandCustomInteraction = {
  name: 'play',
  aliases: ['p', 'pl'],
  djOnly: true,
  premium: false,
  adminOnly: false,
  deferred: true,
  cooldown: 2,
  execute: async (params) => {
    const query = params.interaction.options.getString('запрос', true)
    const count = params.interaction.options.getInteger('количество')
    const offset = params.interaction.options.getInteger('отступ')

    await playCommandHandler(params, query, count, offset)
  }
}
