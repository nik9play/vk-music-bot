import mashupList from '../lists/mashup.json' assert { type: 'json' }
import { playCommandHandler } from '../helpers/playCommandHelper.js'
import { Command } from '../modules/slashCommandManager.js'

export default new Command({
  name: 'mashup',
  djOnly: true,
  adminOnly: false,
  premium: false,
  deferred: true,
  execute: async (params) => {
    const id = mashupList[Math.floor(Math.random() * mashupList.length)]

    await playCommandHandler(params, id)
  }
})
