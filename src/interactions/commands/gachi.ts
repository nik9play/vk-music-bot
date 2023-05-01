import gachiList from '../../lists/gachi.json' assert { type: 'json' }
import { playCommandHandler } from '../../helpers/playCommandHelper.js'
import { CommandCustomInteraction } from '../commandInteractions.js'

export const interaction: CommandCustomInteraction = {
  name: 'gachi',
  djOnly: true,
  adminOnly: false,
  premium: false,
  deferred: true,
  execute: async (params) => {
    const id = gachiList[Math.floor(Math.random() * gachiList.length)]

    await playCommandHandler(params, id)
  }
}
