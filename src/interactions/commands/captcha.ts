import { SlashCommandBuilder } from 'discord.js'
import { playCommandHandler } from '../../helpers/playCommandHelper.js'
import { searchCommandHandler } from '../../helpers/searchCommandHelper.js'
import Utils, { ErrorMessageType } from '../../utils.js'
import { CommandCustomInteraction } from '../commandInteractions.js'

export const interaction: CommandCustomInteraction = {
  name: 'captcha',
  djOnly: true,
  deferred: true,
  cooldown: 5,
  data: new SlashCommandBuilder()
    .setName('captcha')
    .setDescription('Ввод капчи')
    .addStringOption((option) =>
      option.setName('код').setDescription('Код с капчи').setRequired(true)
    )
    .setDMPermission(false),
  execute: async (params) => {
    const captcha = params.client.captcha.get(params.guild.id)

    if (captcha) {
      params.client.captcha.delete(params.guild.id)

      captcha.key = params.interaction.options.getString('код', true)

      params.captcha = captcha

      if (captcha.type === 'play') {
        await playCommandHandler(params, captcha.query, captcha.count, captcha.offset)
      }

      if (captcha.type === 'search') {
        await searchCommandHandler(params, captcha.query)
      }
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
}
