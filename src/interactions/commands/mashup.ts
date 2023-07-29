import mashupList from '../../lists/mashup.json' assert { type: 'json' }
import { playCommandHandler } from '../../helpers/playCommandHelper.js'
import { CommandCustomInteraction } from '../commandInteractions.js'
import { SlashCommandBuilder } from 'discord.js'

export const interaction: CommandCustomInteraction = {
  name: 'mashup',
  djOnly: true,
  deferred: true,
  data: new SlashCommandBuilder()
    .setName('mashup')
    .setDescription('Добавление в очередь случайного мэшапа')
    .setDMPermission(false),
  execute: async (params) => {
    const id = mashupList[Math.floor(Math.random() * mashupList.length)]

    await playCommandHandler(params, id)
  }
}
