import { stopCommand } from '../helpers/stopCommandHelper.js'
import { Command } from '../slashCommandManager.js'

export default new Command({
  name: 'stop',
  aliases: ['s'],
  djOnly: true,
  adminOnly: false,
  premium: false,
  cooldown: 1,
  execute: async (params) => {
    await stopCommand(params)
  }
})


