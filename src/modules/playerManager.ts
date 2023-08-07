import { Guild, VoiceBasedChannel } from 'discord.js'
import { Player } from 'shoukaku'
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
      if (this.client.shoukaku.players.has(guild.id)) return 'Busy'
      let player: Player | null = null

      const channel = guild.client.channels.cache.get(voiceChannelId) as
        | VoiceBasedChannel
        | undefined

      const playerOptions = {
        guildId: guild.id,
        shardId: guild.shardId,
        channelId: voiceChannelId,
        deaf: true
      }

      const loggerInfo = {
        guildId: guild.id,
        shardId: guild.shardId,
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
