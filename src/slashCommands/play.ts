import { Command } from '../slashCommandManager.js'
import { playCommandHandler } from '../helpers/playCommandHelper.js'

export default new Command({
  name: 'play',
  aliases: ['p', 'pl'],
  djOnly: true,
  premium: false,
  adminOnly: false,
  deferred: true,
  cooldown: 2,
  execute: async (params) => {
    const query = params.interaction.options.getString('название', true)
    const count = params.interaction.options.getInteger('количество')
    const offset = params.interaction.options.getInteger('отступ')

    await playCommandHandler(params, query, count, offset)
  }
})
