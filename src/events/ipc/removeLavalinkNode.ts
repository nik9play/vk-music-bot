import { VkMusicBotClient } from '../../client.js'
import { IPCMessage, IPCHandler } from '../ipcManager.js'

export const ipcHandler: IPCHandler = {
  op: 'removeLavalinkNode',
  async handle(msg: IPCMessage<string, boolean>, client: VkMusicBotClient) {
    try {
      const node = msg.content.data
      client.shoukaku.removeNode(node, 'API')
      msg.reply(true)
    } catch {
      msg.reply(false)
    }
  }
}
