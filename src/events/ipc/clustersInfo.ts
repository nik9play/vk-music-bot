import { VkMusicBotClient } from '../../client.js'
import { ENV } from '../../modules/env.js'
import { IPCMessage, IPCHandler } from '../ipcManager.js'
import { NodeInfo } from './getLavalinkNodes.js'

export interface ClusterInfo {
  id: string
  ping: number
  guilds: number
  text: number
  voice: number
  memory: number
  members: number
  lavalink: NodeInfo[]
}

export const ipcHandler: IPCHandler = {
  op: 'clustersInfo',
  async handle(msg: IPCMessage<unknown, ClusterInfo>, client: VkMusicBotClient) {
    const nodes = []
    for (const node of client.shoukaku.nodes.values()) {
      nodes.push({
        name: node.name,
        state: node.state,
        penalties: node.penalties,
        stats: node.stats
      })
    }

    msg.reply({
      id: ENV.INDOMITABLE_CLUSTER,
      ping: client.ws.ping,
      guilds: client.guilds.cache.size,
      text: client.channels.cache.filter((channel) => channel.isTextBased()).size,
      voice: client.channels.cache.filter((channel) => channel.isVoiceBased()).size,
      memory: process.memoryUsage().rss,
      members: client.guilds.cache.reduce((acc, guild) => acc + guild.members.cache.size, 0),
      lavalink: nodes
    })
  }
}
