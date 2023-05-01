import mashupList from '../../lists/mashup.json' assert { type: 'json' }
import { playCommandHandler } from '../../helpers/playCommandHelper.js'
import { CommandCustomInteraction } from '../commandInteractions.js'

export const interaction: CommandCustomInteraction = {
  name: 'mashup',
  djOnly: true,
  adminOnly: false,
  premium: false,
  deferred: true,
  execute: async (params) => {
    const id = mashupList[Math.floor(Math.random() * mashupList.length)]

    await playCommandHandler(params, id)
  }
}
