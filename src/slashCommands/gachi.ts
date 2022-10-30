import gachiList from '../lists/gachi.json' assert { type: 'json' }
import { playCommand } from '../helpers/PlayCommandHelper.js'
import { Command } from '../SlashCommandManager.js'

export default new Command({
  name: 'gachi',
  djOnly: true,
  adminOnly: false,
  premium: false,
  execute: async (params) => {
    const id = gachiList[Math.floor(Math.random() * gachiList.length)]

    await playCommand(params, id)
  }
})
