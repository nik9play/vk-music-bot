import { VkMusicBotClient } from '../../client.js'
import { IPCMessage, IPCHandler } from '../ipcManager.js'

export interface ShardInfo {
  ping: number
  guilds: number
}

export const ipcHandler: IPCHandler = {
  op: 'shardInfo',
  async handle(msg: IPCMessage<unknown, ShardInfo>, client: VkMusicBotClient) {
    msg.reply({ ping: client.ws.ping, guilds: client.guilds.cache.size })
  }
}
