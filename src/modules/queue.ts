import { Guild } from 'discord.js'
import { Node } from 'shoukaku'
import { VkMusicBotClient } from '../client.js'
import logger from '../logger.js'
import BotTrack from '../structures/botTrack.js'
import BotPlayer from './botPlayer.js'

export default class Queue extends Map<string, BotPlayer> {
  public client: VkMusicBotClient

  constructor(client: VkMusicBotClient) {
    super()
    this.client = client
  }

  async handle(guild: Guild, voiceChannelId: string, textChannelId: string, node: Node, tracks: BotTrack[]) {
    const existing = this.get(guild.id)
    if (!existing) {
      if (this.client.shoukaku.players.has(guild.id)) return 'Busy'
      const player = await node.joinChannel({
        guildId: guild.id,
        shardId: guild.shardId,
        channelId: voiceChannelId,
        deaf: true
      })
      logger.debug(`New connection @ guild "${guild.id}"`)
      const dispatcher = new BotPlayer(this.client, guild.id, textChannelId, player)
      dispatcher.queue.push(...tracks)
      this.set(guild.id, dispatcher)
      logger.debug(`New player dispatcher @ guild "${guild.id}"`)
      return dispatcher
    }
    existing.queue.push(...tracks)
    if (!existing.current) await existing.play()
    return null
  }
}