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
    const count = params.interaction.options.getNumber('количество')
    const offset = params.interaction.options.getNumber('отступ')

    await playCommand(params, query, count, offset)
  }
})
