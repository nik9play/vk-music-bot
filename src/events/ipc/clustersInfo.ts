import { VkMusicBotClient } from '../../client.js'
import { IPCMessage, IPCHandler } from '../ipcManager.js'

export interface ClusterInfo {
  id: string
  ping: number
  guilds: number
}

export const ipcHandler: IPCHandler = {
  op: 'clustersInfo',
  async handle(msg: IPCMessage<unknown, ClusterInfo>, client: VkMusicBotClient) {
    msg.reply({ id: process.env.INDOMITABLE_CLUSTER, ping: client.ws.ping, guilds: client.guilds.cache.size })
  }
}
