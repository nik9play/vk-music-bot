import play from './play'
import search from './search'
import { Command, CommandType } from '../SlashCommandManager'
import Utils, { ErrorMessageType } from '../Utils'

export default new Command({
  name: 'captcha',
  djOnly: true,
  adminOnly: false,
  premium: false,
  cooldown: 5,
  execute: async (params) => {
    const captcha = params.client.captcha.get(params.guild.id)
    if (captcha) {
      let command: CommandType
      captcha.captcha_key = params.args[0]

      if (captcha.type == 'search') {
        command = search as CommandType
      } else {
        command = play as CommandType
      }

      params.captcha = captcha
      params.args = captcha.args

      await command.execute(params)
      params.client.captcha.delete(params.guild.id)
    } else {
      params.respond({
        embeds: [Utils.generateErrorMessage('В данный момент капчу вводит не надо.', ErrorMessageType.Info)],
        ephemeral: true
      })
    }
  }
})