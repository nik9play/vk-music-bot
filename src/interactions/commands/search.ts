import { SlashCommandBuilder } from 'discord.js'
import { searchCommandHandler } from '../../helpers/searchCommandHelper.js'
import { CommandCustomInteraction } from '../commandInteractions.js'

export const interaction: CommandCustomInteraction = {
  name: 'search',
  djOnly: true,
  cooldown: 5,
  deferred: true,
  data: new SlashCommandBuilder()
    .setName('search')
    .setDescription('Поиск по названию трека')
    .addStringOption((option) =>
      option.setName('запрос').setDescription('Поисковой запрос').setRequired(true)
    )
    .setDMPermission(false),
  execute: async function (params) {
    const search = params.interaction.options.getString('запрос') as string

    await searchCommandHandler(params, search)
  }
}
