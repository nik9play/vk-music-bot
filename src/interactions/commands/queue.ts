import { generateQueueResponse } from '../../helpers/queueCommandHelper.js'
import { InteractionReplyOptions } from 'discord.js'
import { CommandCustomInteraction } from '../commandInteractions.js'

export const interaction: CommandCustomInteraction = {
  name: 'queue',
  aliases: ['q'],
  djOnly: true,
  adminOnly: false,
  premium: false,
  execute: async ({ guild, respond, interaction, client }) => {
    const player = client.playerManager.get(guild.id)
    const pageParam = interaction.options.getInteger('страница')
    const page = pageParam ?? 1

    await respond(generateQueueResponse(page, player) as InteractionReplyOptions)
  }
}
