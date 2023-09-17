import { Client, ClientOptions, Collection, Events, Message } from 'discord.js'
import Utils, { ErrorMessageType } from './utils.js'
import logger from './logger.js'
import { connectDb, getConfig } from './db.js'
import PlayerManager from './modules/playerManager.js'
import ShoukakuManager from './modules/shoukakuManager.js'
import { CommandInteractionManager } from './interactions/commandInteractions.js'
import { ButtonInteractionManager } from './interactions/buttonInteractions.js'
import { SelectMenuInteractionManager } from './interactions/selectMenuInteractions.js'
import { ModalInteractionManager } from './interactions/modalInteractions.js'
import { IPCManager } from './events/ipcManager.js'
import BaseLoader, { CaptchaInfo } from './loaders/baseLoader.js'
import VKLoader from './loaders/VK/VKLoader.js'
import YandexMusicLoader from './loaders/YandexMusic/YandexMusicLoader.js'
import UserActionsManager from './modules/userActionsManager.js'

// export interface CaptchaInfo {
//   type: 'play' | 'search'
//   query: string
//   count?: number | null
//   offset?: number | null
//   url: string
//   sid: string
//   index: number
//   captcha_key?: string
// }

export interface PlayerTrackErrorTracker {
  count: number
  timer: NodeJS.Timeout
}

export class VkMusicBotClient extends Client {
  public captcha = new Collection<string, CaptchaInfo>()
  public timers = new Collection<string, NodeJS.Timeout>()
  public latestMenus = new Collection<string, Message>()
  public playerTrackErrorTrackers: Collection<string, PlayerTrackErrorTracker> = new Collection()

  public loaders: Collection<string, BaseLoader> = new Collection()
  public loaderNames: string[] = []

  public playerManager: PlayerManager
  public shoukaku: ShoukakuManager
  public userActionsManager: UserActionsManager = new UserActionsManager()

  private _gatewayEventCount = 0

  public get gatewayEventCount() {
    return this._gatewayEventCount
  }

  public commandInteractionManager: CommandInteractionManager
  public buttonInteractionManager: ButtonInteractionManager
  public selectMenuInteractionManager: SelectMenuInteractionManager
  public modalInteractionManager: ModalInteractionManager
  public ipcManager: IPCManager

  constructor(options: ClientOptions) {
    super(options)

    this.playerManager = new PlayerManager(this)
    this.shoukaku = new ShoukakuManager(this)
    this.commandInteractionManager = new CommandInteractionManager(this)
    this.buttonInteractionManager = new ButtonInteractionManager(this)
    this.selectMenuInteractionManager = new SelectMenuInteractionManager(this)
    this.modalInteractionManager = new ModalInteractionManager(this)
    this.ipcManager = new IPCManager(this)

    this.loaders.set('vk', new VKLoader(this))
    this.loaders.set('ya', new YandexMusicLoader(this))

    this.loaderNames = [...this.loaders.keys()]

    this.once(Events.ClientReady, async () => {
      logger.info(`Logged in as ${this.user?.tag} successfully`)

      await Promise.all([
        this.commandInteractionManager.load(),
        this.buttonInteractionManager.load(),
        this.selectMenuInteractionManager.load(),
        this.modalInteractionManager.load()
      ])

      logger.info(`Loaded ${this.commandInteractionManager.interactions.size} commands.`)
      logger.info(`Loaded ${this.buttonInteractionManager.interactions.size} button interactions.`)

      this.user?.setPresence({
        activities: [
          {
            name: '/help',
            type: 2
          }
        ]
      })
    })
      // .on(Events.Raw, () => {
      //   this._gatewayEventCount++
      // })
      .on(Events.MessageDelete, (message) => {
        logger.debug({ message })

        if (message.id && message.guildId) {
          const menuMessage = this.latestMenus.get(message.guildId)
          if (!menuMessage) return

          if (message.id === menuMessage.id) {
            this.latestMenus.delete(message.guildId)
            logger.debug({ guild_id: message.guildId }, 'Removed latestMenusMessage')
          }
        }
      })

      // TODO: fix this shit
      .on(Events.VoiceStateUpdate, async (oldState, newState) => {
        logger.debug({
          newState: newState,
          oldState: oldState
        })

        let channelIsEmpty = false
        let voiceChannel = null

        if (oldState.id === this.user?.id) {
          const newChannelId = newState.channelId
          const oldChannelId = oldState.channelId
          const guildId = newState.guild.id

          const player = this.playerManager.get(guildId)
          if (!player) return

          const config = await getConfig(guildId)

          let state: 'UNKNOWN' | 'LEFT' | 'JOINED' | 'MOVED' = 'UNKNOWN'
          if (!oldChannelId && newChannelId) state = 'JOINED'
          else if (oldChannelId && !newChannelId) state = 'LEFT'
          else if (oldChannelId && newChannelId && oldChannelId !== newChannelId) state = 'MOVED'

          if (state === 'UNKNOWN') return

          if (state === 'LEFT') {
            logger.debug({ guild_id: guildId }, 'Player left')
            await player.safeDestroy()
            return
          }

          if (state === 'MOVED' && !config.enable247) {
            logger.debug({ guild_id: guildId }, 'Player moved')
            voiceChannel = newState.channel
            const members = voiceChannel?.members.filter((m) => !m.user.bot)

            channelIsEmpty = members?.size === 0
          }
        } else {
          voiceChannel = oldState.channel || newState.channel
          if (!voiceChannel) return

          if (this?.user && !voiceChannel.members.has(this.user.id)) return

          const members = voiceChannel.members.filter((m) => !m.user.bot)

          channelIsEmpty = members.size === 0
        }

        if (channelIsEmpty && voiceChannel && !(await getConfig(voiceChannel.guildId)).enable247) {
          const player = this.playerManager.get(voiceChannel.guildId)
          if (!player) return

          const textId = player.textChannelId

          await player.safeDestroy()

          const channel = this.channels.cache.get(textId)
          if (!channel?.isTextBased()) return

          await Utils.sendMessageToChannel(
            channel,
            {
              embeds: [
                Utils.generateErrorMessage(
                  'Бот вышел из канала, так как тут никого нет. ' +
                    'Включите режим 24/7 (</247:906533610918666250>), если не хотите, чтобы это происходило.',
                  ErrorMessageType.Info
                )
              ]
            },
            30_000
          )

          logger.debug({ guild_id: voiceChannel.guildId }, 'Player leaved empty channel')
        }
      })
  }

  async login(token?: string | undefined) {
    await super.login(token)

    await connectDb()
    logger.info('DB connected.')

    await this.ipcManager.load()

    return this.constructor.name
  }
}
