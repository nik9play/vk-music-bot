import gachiList from '../lists/gachi.json' assert { type: 'json' }
import { playCommand } from '../helpers/playCommandHelper.js'
import { Command } from '../slashCommandManager.js'

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
