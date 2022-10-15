import { Command } from '../SlashCommandManager'
import { playCommand } from '../helpers/PlayCommandHelper'

export default new Command({
  name: 'play',
  aliases: ['p', 'pl'],
  djOnly: true,
  premium: false,
  adminOnly: false,
  deferred: true,
  cooldown: 2,
  execute: async (params) => {
    const query = params.interaction.options.getString('название') as string
    const count = params.interaction.options.getInteger('количество')
    const offset = params.interaction.options.getInteger('отступ')

    await playCommand(params, query, count, offset)
  }
})
