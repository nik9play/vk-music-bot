import { Command } from '../SlashCommandManager'
import { generateQueueResponse } from '../helpers/QueueCommandHelper'
import { InteractionReplyOptions } from 'discord.js'

export default new Command({
  name: 'queue',
  aliases: ['q'],
  djOnly: true,
  adminOnly: false,
  premium: false,
  execute: async ({ guild, respond, args, client }) => {
    const player = client.manager.get(guild.id)
    const page = args.length && Number(args[0]) ? Number(args[0]) : 1

    await respond(generateQueueResponse(page, player) as InteractionReplyOptions)
    return
  }
})