import { Guild, VoiceBasedChannel } from 'discord.js'
import { Player, VoiceChannelOptions } from 'shoukaku'
import { VkMusicBotClient } from '../client.js'
import logger from '../logger.js'
import BotTrack from '../structures/botTrack.js'
import BotPlayer from './botPlayer.js'
import Utils from '../utils.js'

export default class PlayerManager extends Map<string, BotPlayer> {
  public client: VkMusicBotClient

  constructor(client: VkMusicBotClient) {
    super()
    this.client = client
  }

  async handle(guild: Guild, voiceChannelId: string, textChannelId: string, tracks: BotTrack[]) {
    if (tracks.length === 0) return null

    const existing = this.get(guild.id)
    if (!existing) {
      if (
        this.client.shoukaku.players.has(guild.id) ||
        this.client.shoukaku.connections.has(guild.id)
      )
        return 'Busy'
      let player: Player | null = null

      const channel = guild.client.channels.cache.get(voiceChannelId) as
        | VoiceBasedChannel
        | undefined

      const node = this.client.shoukaku.getIdealNode()

      const playerOptions: VoiceChannelOptions = {
        guildId: guild.id,
        shardId: guild.shardId,
        channelId: voiceChannelId,
        getNode: () => node,
        deaf: true
      }

      const loggerInfo = {
        guild_id: guild.id,
        shard_id: guild.shardId,
        node_name: node?.name,
        region: channel?.rtcRegion ?? 'auto'
      }

      try {
        // force disconnect from channel if player is not existing

        if (guild.members.me?.voice.channelId) {
          Utils.forceLeave(guild)
          await Utils.delay(1000)
        }

        logger.info(
          {
            botVoiceStateVoiceId: guild.members.me?.voice.channelId,
            sessionId: guild.members.me?.voice.sessionId,
            ...loggerInfo
          },
          'Bot voice info'
        )

        player = await this.client.shoukaku.joinVoiceChannel(playerOptions)

        logger.info(
          {
            botVoiceStateVoiceId: guild.members.me?.voice.channelId,
            sessionId: guild.members.me?.voice.sessionId,
            ...loggerInfo
          },
          'Bot voice info 2'
        )
      } catch (err) {
        logger.error({ ...loggerInfo, err }, "Can't connect to voice channel")
        // throw err

        try {
          Utils.forceLeave(guild)
          await Utils.delay(1000)
          player = await this.client.shoukaku.joinVoiceChannel(playerOptions)
        } catch (err) {
          logger.error(loggerInfo, "Can't connect to voice channel a second time(((")
          throw err
        }
      }

      logger.debug(`New connection @ guild "${guild.id}"`)
      const botPlayer = new BotPlayer(this.client, guild.id, textChannelId, player)
      for (const track of tracks) {
        botPlayer.queue.push(track)
      }
      this.set(guild.id, botPlayer)
      logger.debug(`New player dispatcher @ guild "${guild.id}"`)

      return botPlayer
    }
    for (const track of tracks) {
      existing.queue.push(track)
    }

    // if (!existing.current) await existing.play()
    return existing
  }
}
