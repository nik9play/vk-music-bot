import { Constants, Player, UpdatePlayerOptions, Node } from 'shoukaku'
import { VkMusicBotClient } from '../client.js'
import { getConfig, updateConfig } from '../db.js'
import {
  deletePreviousTrackStartMessage,
  generatePlayerStartMessage
} from '../helpers/playerStartHelper.js'
import logger from '../logger.js'
import BotTrack from '../structures/botTrack.js'
import Utils, { ErrorMessageType } from '../utils.js'
import { DiscordAPIError, Guild, TextChannel, VoiceChannel } from 'discord.js'
import Denque from 'denque'

export enum Repeat {
  Off,
  Track,
  Queue
}

export default class BotPlayer {
  public client: VkMusicBotClient
  public guildId: string
  public textChannelId: string
  public player: Player
  public queue: Denque<BotTrack>
  // public current?: BotTrack | null
  public repeat: Repeat
  public stopped: boolean
  public reconnecting: boolean

  get guild(): Guild | undefined {
    return this.client.guilds.cache.get(this.guildId)
  }

  get textChannel(): TextChannel | VoiceChannel | undefined {
    return this.client.channels.cache.get(this.textChannelId) as TextChannel | VoiceChannel
  }

  get idealNodeDefault(): Node | undefined {
    return this.client.shoukaku.getIdealNode()
  }

  get current(): BotTrack | undefined {
    return this.queue.peekAt(0)
  }

  constructor(client: VkMusicBotClient, guildId: string, textChannelId: string, player: Player) {
    this.client = client
    this.guildId = guildId
    this.textChannelId = textChannelId
    this.player = player
    this.repeat = Repeat.Off
    // this.current = null
    this.queue = new Denque()
    this.stopped = true
    this.reconnecting = false

    this.player
    // .on('start', (data) => {
    //   logger.debug({ guild_id: data.guildId }, 'Start repeat event')

    //   if (this.repeat === 'track') {
    //     if (notifiedOnce) return
    //     else notifiedOnce = true
    //   } else if (this.repeat === 'queue' || this.repeat === 'none') {
    //     notifiedOnce = false
    //   }
    // })
    this.player
      .on('start', async (data) => {
        logger.debug({ guild_id: data.guildId }, 'Start event')

        const config = await getConfig(this.guildId)

        if (config.announcements && this.textChannel) {
          try {
            if (!this.current) return

            const message = await Utils.sendMessageToChannel(
              this.textChannel,
              await generatePlayerStartMessage(this, this.current)
            )
            if (message) client.latestMenus.set(this.guildId, message)
          } catch (err) {
            logger.error({ err }, "Can't send player start message")
          }
        }
      })
      .on('end', async (data) => {
        logger.info({ guild_id: data.guildId }, 'End event')

        if (this.stopped) return
        if (this.repeat !== Repeat.Track) {
          const track = this.queue.removeOne(0)
          if (track && !track.isErrored && this.repeat === Repeat.Queue) this.queue.push(track)
        }

        await Promise.all([deletePreviousTrackStartMessage(client, this.guildId), this.play()])

        if (this.queue.isEmpty() && !(await getConfig(this.guildId)).enable247) {
          Utils.setExitTimeout(this, this.client)
          this.stopped = true
        }
      })
      .on('stuck', async (data) => {
        logger.error({ guild_id: data.guildId }, 'Stuck event')
        this.player.emit('end', data)
      })
      .on('exception', (data) => {
        logger.error({ data }, 'Track exception')

        if (this.current) this.current.isErrored = true
      })
      .on('closed', (data) => {
        logger.error({ data }, 'BotPlayer closed')
      })
      .on('update', async (data) => {
        const config = await getConfig(data.guildId)
        if ((data.state.position !== undefined && data.state.position < 10_000) || !config.premium)
          return

        if (this.current) {
          const message = this.client.latestMenus.get(this.guildId)
          if (!message || !message.editable) return

          await message.edit(await generatePlayerStartMessage(this, this.current)).catch((err) => {
            if (err instanceof DiscordAPIError && err.code === 10008) {
              this.client.latestMenus.delete(this.guildId)
              logger.warn(
                { err: err.message, guildId: message.guildId },
                "Can't edit player start message:, message is not found"
              )

              return
            }

            logger.error(
              { err: err.message, guildId: message.guildId },
              "Can't edit player start message"
            )
          })
        }
      })
      .on('resumed', async () => {
        const channel = this.client.channels.cache.get(this.textChannelId)
        if (!channel?.isTextBased()) return

        await Utils.sendMessageToChannel(
          channel,
          {
            embeds: [
              Utils.generateErrorMessage(
                'Бот успешно переподключился к серверу.',
                ErrorMessageType.Info
              )
            ]
          },
          20_000
        )
        this.reconnecting = false
      })
    //.on('error', this.errorHandler)
    //this.closeHandlerEvent = this.closeHandler.bind(this)
    this.client.shoukaku.on('close', this.closeHandlerEvent)
    this.client.shoukaku.on('disconnect', this.disconnectHandlerEvent)
    // this.player.node.on('debug', (data) => {
    //   logger.debug({ data }, 'debugf')
    // })
  }

  private closeHandlerEvent = async (name: string) => {
    if (this.player.node.name !== name) return
    if (this.reconnecting) return

    await deletePreviousTrackStartMessage(this.client, this.guildId)
    const channel = this.client.channels.cache.get(this.textChannelId)
    if (!channel?.isTextBased()) return

    await Utils.sendMessageToChannel(
      channel,
      {
        embeds: [
          Utils.generateErrorMessage(
            'Бот пытается переподключиться к серверу воспроизведения, подождите 1-2 минуты...',
            ErrorMessageType.Warning
          )
        ]
      },
      40_000
    )
    this.reconnecting = true
  }

  private disconnectHandlerEvent = async (name: string) => {
    if (this.player.node.name === name) {
      await Promise.all([
        deletePreviousTrackStartMessage(this.client, this.guildId),
        this.destroy(false)
      ])
    }
  }

  get volume() {
    return this.player.volume
  }

  public async setVolume(volume: number) {
    if (volume > 1000) volume = 1000
    if (volume < 1) volume = 1

    await Promise.all([this.player.setGlobalVolume(volume), updateConfig(this.guildId, { volume })])
  }

  get exists() {
    return this.client.playerManager.has(this.guildId)
  }

  private async playTrackFromIdentifier(identifier: string, volume: number) {
    const playerOptions: UpdatePlayerOptions = {
      identifier,
      volume
    }

    const playerData = await this.player.node.rest.updatePlayer({
      guildId: this.guildId,
      noReplace: false,
      playerOptions
    })
    this.player.track = playerData?.track?.encoded ?? null
  }

  async play() {
    if (!this.exists) return await this.destroy()

    const volume = (await getConfig(this.guildId)).volume

    Utils.clearExitTimeout(this.guildId, this.client)

    try {
      if (this.current?.loadedTrack)
        await this.player.playTrack({
          track: this.current.loadedTrack.encoded,
          options: { volume }
        })
      if (this.current?.identifier)
        await this.playTrackFromIdentifier(this.current?.identifier, volume)
    } catch {
      await this.play()
    }
  }

  async destroy(destroyRemotePlayer = true, reason?: string) {
    this.client.shoukaku.off('close', this.closeHandlerEvent)
    this.client.shoukaku.off('disconnect', this.disconnectHandlerEvent)

    this.queue.clear()
    try {
      await this.client.shoukaku.leaveVoiceChannel(this.guildId)
    } catch (err) {
      logger.error(
        { err },
        'Unable to destroy connection, trying to disconnect without destroying remote player'
      )
      if (destroyRemotePlayer)
        try {
          await this.player.destroyPlayer(true)
        } catch (err) {
          logger.error({ err }, 'Unable to destroy remote connection, but it should be fine... ')
        }
    }
    this.client.playerManager.delete(this.guildId)

    Utils.clearExitTimeout(this.guildId, this.client)

    logger.debug(
      { guild_id: this.guildId },
      `Destroyed the player & connection \nReason: ${reason || 'No Reason Provided'}`
    )
    if (this.stopped) return
  }

  async safeDestroy() {
    this.stopped = true
    await Promise.all([
      deletePreviousTrackStartMessage(this.client, this.guildId),
      this.destroy(this.player.node.state === Constants.State.CONNECTED)
    ])
  }

  async stop() {
    // await this.player.setPaused(false)
    this.repeat = Repeat.Off
    this.queue.clear()
    this.stopped = true

    await Promise.all([
      this.player.stopTrack(),
      deletePreviousTrackStartMessage(this.client, this.guildId)
    ])

    if (!(await getConfig(this.guildId)).enable247) Utils.setExitTimeout(this, this.client)
  }

  async skip(count = 1) {
    console.log(this.queue.remove(1, count - 1))

    await this.player.setPaused(false)
    await this.player.stopTrack()
    if (this.queue.isEmpty() && !(await getConfig(this.guildId)).enable247) {
      Utils.setExitTimeout(this, this.client)
      this.stopped = true
    }
  }

  // shuffle() {
  //   for (let i = this.queue.length - 1; i > 0; i--) {
  //     const j = Math.floor(Math.random() * (i + 1))
  //     ;[this.queue[i], this.queue[j]] = [this.queue[j], this.queue[i]]
  //   }
  // }

  shuffleQueue() {
    if (this.queue.length > 2) {
      const tracks = Utils.shuffleArray(this.queue.remove(1, this.queue.length))
      for (const track of tracks) this.queue.push(track)
    }
  }
}
