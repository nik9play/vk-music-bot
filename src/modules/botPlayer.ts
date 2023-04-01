import { Player, UpdatePlayerOptions } from 'shoukaku'
import { VkMusicBotClient } from '../client.js'
import { getConfig } from '../db.js'
import { deletePreviousTrackStartMessage, generatePlayerStartMessage } from '../helpers/playerStartHelper.js'
import logger from '../logger.js'
import BotTrack from '../structures/botTrack.js'
import Utils from '../utils.js'

export default class BotPlayer {
  public client: VkMusicBotClient
  public guildId: string
  public textChannelId: string
  public player: Player
  public queue: BotTrack[]
  public current?: BotTrack | null
  public repeat: 'none' | 'track' | 'queue'
  public stopped: boolean

  constructor(client: VkMusicBotClient, guildId: string, textChannelId: string, player: Player) {
    this.client = client
    this.guildId = guildId
    this.textChannelId = textChannelId
    this.player = player
    this.repeat = 'none'
    this.current = null
    this.queue = []
    this.stopped = false

    let notifiedOnce = false

    this.player
      .on('start', async () => {
        if (this.repeat === 'track') {
          if (notifiedOnce) return
          else notifiedOnce = true
        } else if (this.repeat === 'queue' || this.repeat === 'none') {
          notifiedOnce = false
        }

        // TODO: playerStart message handling
        const config = await getConfig(this.guildId)

        if (config.announcements) {
          const channel = client.channels.cache.get(this.textChannelId)

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
      .on('end', async () => {
        if (this.repeat === 'track' && this.current) this.queue.unshift(this.current)
        if (this.repeat === 'queue' && this.current) this.queue.push(this.current)
        await deletePreviousTrackStartMessage(client, this.guildId)
        await this.play()
        if (this.queue.length === 0 && !this.current && !(await getConfig(this.guildId)).enable247) {
          Utils.setExitTimeout(this, this.client)
        }
      })
      .on('stuck', async () => {
        if (this.repeat === 'track' && this.current) this.queue.unshift(this.current)
        if (this.repeat === 'queue' && this.current) this.queue.push(this.current)
        await this.play()
        if (this.queue.length === 0 && !this.current && !(await getConfig(this.guildId)).enable247) {
          Utils.setExitTimeout(this, this.client)
        }
      })
      .on('closed', (data) => this.errorHandler(data))
      .on('update', () => {
        if (this.current) {
          const message = this.client.latestMenus.get(this.guildId)
          if (!message) return

          if (message.editable)
            message
              .edit(generatePlayerStartMessage(this, this.current))
              .catch((err) => logger.error({ err }, "Can't edit player start message"))
        }
      })
    //.on('error', this.errorHandler)
  }

  async errorHandler(data: any) {
    if (data instanceof Error || data instanceof Object) logger.debug(data, 'BotPlayer closed')
    // this.queue.length = 0
    // await this.destroy()
  }

  get exists() {
    return this.client.queue.has(this.guildId)
  }

  private async playTrackFromIdentifier(identifier: string) {
    const playerOptions: UpdatePlayerOptions = {
      identifier: identifier
    }

    await this.player.node.rest.updatePlayer({
      guildId: this.guildId,
      noReplace: false,
      playerOptions
    })
  }

  async play() {
    if (!this.exists) return await this.destroy()
    Utils.clearExitTimeout(this.guildId, this.client)
    this.current = this.queue.shift()
    if (this.current?.loadedTrack) await this.player.playTrack({ track: this.current.loadedTrack.encoded })
    if (this.current?.identifier) await this.playTrackFromIdentifier(this.current?.identifier)
  }

  async destroy(reason?: string) {
    this.queue.length = 0
    await this.player.connection.disconnect()
    this.client.queue.delete(this.guildId)

    Utils.clearExitTimeout(this.guildId, this.client)

    logger.debug(
      `Destroyed the player & connection @ guild "${this.guildId}"\nReason: ${reason || 'No Reason Provided'}`
    )
    if (this.stopped) return
  }

  async stop() {
    await this.player.setPaused(false)
    this.repeat = 'none'
    this.queue.length = 0
    this.stopped = true
    await this.player.stopTrack()
    if (!(await getConfig(this.guildId))) Utils.setExitTimeout(this, this.client)
  }

  async skip(count?: number) {
    if (!count) count = 1

    this.queue.slice(0, count - 1)

    await this.player.setPaused(false)
    await this.player.stopTrack()
    if (this.queue.length === 0 && !this.current && !(await getConfig(this.guildId))) {
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
