import gachiList from '../../lists/gachi.json' assert { type: 'json' }
import { playCommandHandler } from '../../helpers/playCommandHelper.js'
import { CommandCustomInteraction } from '../commandInteractions.js'
import { SlashCommandBuilder } from 'discord.js'

export const interaction: CommandCustomInteraction = {
  name: 'gachi',
  djOnly: true,
  deferred: true,
  data: new SlashCommandBuilder()
    .setName('gachi')
    .setDescription('Добавление в очередь случайного гачи ремикса')
    .setDMPermission(false),
  execute: async (params) => {
    const id = gachiList[Math.floor(Math.random() * gachiList.length)]

    await playCommandHandler(params, id)
  }
}
