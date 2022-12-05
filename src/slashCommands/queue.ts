import { Command } from '../slashCommandManager.js'
import { generateQueueResponse } from '../helpers/queueCommandHelper.js'
import { InteractionReplyOptions } from 'discord.js'

export default new Command({
  name: 'queue',
  aliases: ['q'],
  djOnly: true,
  adminOnly: false,
  premium: false,
  execute: async ({ guild, respond, interaction, client }) => {
    const player = client.manager.get(guild.id)
    const pageParam = interaction.options.getInteger('страница')
    const page = pageParam ?? 1

    await respond(generateQueueResponse(page, player) as InteractionReplyOptions)
  }
})
