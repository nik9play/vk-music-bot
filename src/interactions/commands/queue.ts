import { generateQueueResponse } from '../../helpers/queueCommandHelper.js'
import { InteractionReplyOptions, SlashCommandBuilder } from 'discord.js'
import { CommandCustomInteraction } from '../commandInteractions.js'

export const interaction: CommandCustomInteraction = {
  name: 'queue',
  aliases: ['q'],
  djOnly: true,
  data: new SlashCommandBuilder()
    .setName('queue')
    .setDescription('Вывод очереди')
    .addIntegerOption((option) =>
      option
        .setName('страница')
        .setDescription('Страница с очередью')
        .setMinValue(1)
        .setMaxValue(200)
    )
    .setDMPermission(false),
  execute: async ({ guild, respond, interaction, client }) => {
    const player = client.playerManager.get(guild.id)
    const pageParam = interaction.options.getInteger('страница')
    const page = pageParam ?? 1

    await respond(generateQueueResponse(page, player) as InteractionReplyOptions)
  }
}
