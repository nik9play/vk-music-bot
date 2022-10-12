import { playCommand } from '../helpers/PlayCommandHelper'
import { searchCommand } from '../helpers/SearchCommandHelper'
import { Command } from '../SlashCommandManager'
import Utils, { ErrorMessageType } from '../Utils'

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
      captcha.captcha_key = params.interaction.options.getString(
        'код'
      ) as string
      params.captcha = captcha

      if (captcha.type === 'play') {
        await playCommand(params, captcha.query, captcha.count, captcha.offset)
      }

      if (captcha.type === 'search') {
        await searchCommand(params, captcha.query)
      }

      params.client.captcha.delete(params.guild.id)
    } else {
      await params.respond({
        embeds: [
          Utils.generateErrorMessage(
            'В данный момент капчу вводить не надо.',
            ErrorMessageType.Info
          )
        ],
        ephemeral: true
      })
    }
  }
})
