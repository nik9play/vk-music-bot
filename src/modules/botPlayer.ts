import { Constants, Player, UpdatePlayerOptions } from 'shoukaku'
import { VkMusicBotClient } from '../client.js'
import { getConfig } from '../db.js'
import { deletePreviousTrackStartMessage, generatePlayerStartMessage } from '../helpers/playerStartHelper.js'
import logger from '../logger.js'
import BotTrack from '../structures/botTrack.js'
import Utils, { ErrorMessageType } from '../utils.js'

export default class BotPlayer {
  public client: VkMusicBotClient
  public guildId: string
  public textChannelId: string
  public player: Player
  public queue: BotTrack[]
  public current?: BotTrack | null
  public repeat: 'none' | 'track' | 'queue'
  public stopped: boolean
  public reconnecting: boolean

  constructor(client: VkMusicBotClient, guildId: string, textChannelId: string, player: Player) {
    this.client = client
    this.guildId = guildId
    this.textChannelId = textChannelId
    this.player = player
    this.repeat = 'none'
    this.current = null
    this.queue = []
    this.stopped = false
    this.reconnecting = false

    let notifiedOnce = false

    this.player.on('start', (data) => {
      logger.debug({ guildId: data.guildId }, 'Start repeat event')

      if (this.repeat === 'track') {
        if (notifiedOnce) return
        else notifiedOnce = true
      } else if (this.repeat === 'queue' || this.repeat === 'none') {
        notifiedOnce = false
      }
    })
    this.player
      .on('start', async (data) => {
        logger.debug({ guildId: data.guildId }, 'Start event')

        const config = await getConfig(this.guildId)

        if (config.announcements) {
          const channel = client.channels.cache.get(this.textChannelId)
          logger.debug({ channel: channel?.id, current: this.current })

          if (!channel?.isTextBased()) return

          try {
            //clearTimeout(client.latestMenusTimeouts.get(player.guildId))

            if (!this.current) return

            const message = await channel.send(generatePlayerStartMessage(this, this.current))
            client.latestMenus.set(this.guildId, message)
          } catch (err) {
            logger.error({ err }, "Can't send player start message")
          }
        }
      })
      .on('end', async (data) => {
        logger.debug({ guildId: data.guildId }, 'End event')
        if (this.repeat === 'track' && this.current) this.queue.unshift(this.current)
        if (this.repeat === 'queue' && this.current) this.queue.push(this.current)
        await deletePreviousTrackStartMessage(client, this.guildId)
        await this.play()
        if (this.queue.length === 0 && !this.current && !(await getConfig(this.guildId)).enable247) {
          Utils.setExitTimeout(this, this.client)
        }
      })
      .on('stuck', async (data) => {
        logger.debug({ guildId: data.guildId }, 'Stuck event')
        if (this.repeat === 'track' && this.current) this.queue.unshift(this.current)
        if (this.repeat === 'queue' && this.current) this.queue.push(this.current)
        await this.play()
        if (this.queue.length === 0 && !this.current && !(await getConfig(this.guildId)).enable247) {
          Utils.setExitTimeout(this, this.client)
        }
      })
      .on('exception', (data) => this.errorHandler(data))
      .on('closed', (data) => this.errorHandler(data))
      .on('update', (data) => {
        if (data.state.position !== undefined && data.state.position < 10_000) return

        if (this.current) {
          const message = this.client.latestMenus.get(this.guildId)
          if (!message) return

          if (message.editable)
            message
              .edit(generatePlayerStartMessage(this, this.current))
              .catch((err) => logger.error({ err: err.message }, "Can't edit player start message"))
        }
      })
      // eslint-disable-next-line @typescript-eslint/ban-ts-comment
      //@ts-ignore
      .on('resume', async () => {
        const channel = this.client.channels.cache.get(this.textChannelId)
        if (!channel?.isTextBased()) return

        await Utils.sendMessageToChannel(
          channel,
          {
            embeds: [Utils.generateErrorMessage('Бот успешно переподключился к серверу.', ErrorMessageType.Info)]
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

  private closeHandlerEvent = async () => {
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
      deletePreviousTrackStartMessage(this.client, this.guildId)
      await this.destroy(false)
    }
  }

  async errorHandler(data: any) {
    logger.debug(data, 'BotPlayer closed')
    if (data instanceof Error || data instanceof Object) logger.debug(data, 'BotPlayer closed')
    // this.queue.length = 0
    // await this.destroy()
  }

  get exists() {
    return this.client.playerManager.has(this.guildId)
  }

  private async playTrackFromIdentifier(identifier: string) {
    const playerOptions: UpdatePlayerOptions = {
      identifier: identifier
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
    Utils.clearExitTimeout(this.guildId, this.client)
    this.current = this.queue.shift()
    try {
      if (this.current?.loadedTrack) await this.player.playTrack({ track: this.current.loadedTrack.encoded })
      if (this.current?.identifier) await this.playTrackFromIdentifier(this.current?.identifier)
    } catch {
      await this.play()
    }
  }

  async destroy(destroyRemoteServer = true, reason?: string) {
    this.client.shoukaku.off('close', this.closeHandlerEvent)
    this.client.shoukaku.off('disconnect', this.disconnectHandlerEvent)

    this.queue.length = 0
    await this.player.connection.disconnect(destroyRemoteServer)
    this.client.playerManager.delete(this.guildId)

    Utils.clearExitTimeout(this.guildId, this.client)

    logger.debug(
      `Destroyed the player & connection @ guild "${this.guildId}"\nReason: ${reason || 'No Reason Provided'}`
    )
    if (this.stopped) return
  }

  async safeDestroy() {
    await Promise.all([
      deletePreviousTrackStartMessage(this.client, this.guildId),
      this.destroy(this.player.node.state === Constants.State.CONNECTED)
    ])
  }

  async stop() {
    await this.player.setPaused(false)
    this.repeat = 'none'
    this.queue.length = 0
    this.stopped = true
    await this.player.stopTrack()
    if (!(await getConfig(this.guildId)).enable247) Utils.setExitTimeout(this, this.client)
  }

  async skip(count = 1) {
    this.queue.splice(0, count - 1)

    await this.player.setPaused(false)
    await this.player.stopTrack()
    if (this.queue.length === 0 && !this.current && !(await getConfig(this.guildId)).enable247) {
      Utils.setExitTimeout(this, this.client)
    }
  }

  shuffle() {
    for (let i = this.queue.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1))
      ;[this.queue[i], this.queue[j]] = [this.queue[j], this.queue[i]]
    }
  }
}
