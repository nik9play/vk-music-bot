import { NodeStats } from 'shoukaku'
import { VkMusicBotClient } from '../../client.js'
import { IPCMessage, IPCHandler } from '../ipcManager.js'

export interface NodeInfo {
  name: string
  state: number
  penalties: number
  stats: NodeStats | null
}

export const ipcHandler: IPCHandler = {
  op: 'getLavalinkNodes',
  async handle(msg: IPCMessage<unknown, NodeInfo[]>, client: VkMusicBotClient) {
    const nodes = []
    for (const node of client.shoukaku.nodes.values()) {
      nodes.push({
        name: node.name,
        state: node.state,
        penalties: node.penalties,
        stats: node.stats
      })
    }

    msg.reply(nodes)
  }
}
