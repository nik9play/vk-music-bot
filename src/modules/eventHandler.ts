// import { VkMusicBotClient } from '../client.js'
// import { readdirSync } from 'fs'
// import logger from '../logger.js'
// import glob from 'glob'
// import { promisify } from 'util'
// import BotEvent from '../structures/event.js'

// const globPromise = promisify(glob)

// export default class EventHandler {
//   public client: VkMusicBotClient
//   public built: boolean

//   constructor(client: VkMusicBotClient) {
//     this.client = client
//     this.built = false
//   }

//   async build() {
//     if (this.built) return this
//     const events = await globPromise('**/dist/events/discord/*.js')
//     let index = 0
//     for (const event of events) {
//       const module = (await import(`../events/discord/${event}`)) as BotEvent
//       const exec = module.exec.bind(module)

//       module.once ? this.client.once(module.name, exec) : this.client.on(module.name, exec)
//       index++
//     }
//     logger.debug(this.constructor.name, `Loaded ${index} client event(s)`)
//     this.built = true
//     return this
//   }
// }
