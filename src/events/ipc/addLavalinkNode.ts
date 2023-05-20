import { NodeOption } from 'shoukaku'
import { VkMusicBotClient } from '../../client.js'
import { IPCMessage, IPCHandler } from '../ipcManager.js'

export const ipcHandler: IPCHandler = {
  op: 'addLavalinkNode',
  async handle(msg: IPCMessage<NodeOption, unknown>, client: VkMusicBotClient) {
    const node = msg.content.data
    client.shoukaku.addNode(node)
  }
}
