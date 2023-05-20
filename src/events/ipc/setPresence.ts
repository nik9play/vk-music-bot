import { VkMusicBotClient } from '../../client.js'
import { IPCMessage, IPCHandler } from '../ipcManager.js'

export const ipcHandler: IPCHandler = {
  op: 'setPresence',
  async handle(msg: IPCMessage<string>, client: VkMusicBotClient) {
    client.user?.setPresence({
      activities: [
        {
          name: msg.content.data,
          type: 2
        }
      ]
    })
  }
}
