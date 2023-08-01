import { SlashCommandBuilder } from 'discord.js'
import { playCommandHandler } from '../../helpers/playCommandHelper.js'
import { CommandCustomInteraction } from '../commandInteractions.js'

export const interaction: CommandCustomInteraction = {
  name: 'play',
  djOnly: true,
  deferred: true,
  cooldown: 2,
  data: new SlashCommandBuilder()
    .setName('play')
    .setDescription('Добавляет в очередь трек/треки')
    .addStringOption((option) =>
      option
        .setName('запрос')
        .setDescription('Название трека или ссылка на плейлист/пользователя')
        .setRequired(true)
        .setMaxLength(2000)
    )
    .addIntegerOption((option) =>
      option
        .setName('количество')
        .setDescription('Количество треков, которые добавить (по умолчанию 50)')
        .setMinValue(1)
        .setMaxValue(20_000)
    )
    .addIntegerOption((option) =>
      option
        .setName('отступ')
        .setDescription('Отступ от начала списка треков')
        .setMinValue(1)
        .setMaxValue(20_000)
    )
    .addStringOption((option) =>
      option
        .setName('источник')
        .setDescription('Источник для поиска треков')
        .addChoices({ name: 'ВК', value: 'vk' }, { name: 'ЯМузыка', value: 'ya' })
    )
    .setDMPermission(false),
  execute: async (params) => {
    const query = params.interaction.options.getString('запрос', true)
    const count = params.interaction.options.getInteger('количество')
    const offset = params.interaction.options.getInteger('отступ')
    const loader = params.interaction.options.getString('источник')

    await playCommandHandler(params, query, count, offset, loader)
  }
}
