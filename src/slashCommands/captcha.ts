import { playCommand } from '../helpers/playCommandHelper.js'
import { searchCommand } from '../helpers/searchCommandHelper.js'
import { Command } from '../slashCommandManager.js'
import Utils, { ErrorMessageType } from '../utils.js'

export default new Command({
  name: 'captcha',
  djOnly: true,
  adminOnly: false,
  premium: false,
  deferred: true,
  cooldown: 5,
  execute: async (params) => {
    const captcha = params.client.captcha.get(params.guild.id)

    if (captcha) {
      params.client.captcha.delete(params.guild.id)

      captcha.captcha_key = params.interaction.options.getString('код', true)

      params.captcha = captcha

      if (captcha.type === 'play') {
        await playCommand(params, captcha.query, captcha.count, captcha.offset)
      }

      if (captcha.type === 'search') {
        await searchCommand(params, captcha.query)
      }
    } else {
      await params.respond({
        embeds: [Utils.generateErrorMessage('В данный момент капчу вводить не надо.', ErrorMessageType.Info)],
        ephemeral: true
      })
    }
  }
})
