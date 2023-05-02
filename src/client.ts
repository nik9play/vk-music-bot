import { Client, ClientOptions, Collection, Message } from 'discord.js'
import Utils, { ErrorMessageType } from './utils.js'
import logger from './logger.js'
import { connectDb, getConfig } from './db.js'
import PlayerManager from './modules/queue.js'
import ShoukakuManager from './modules/shoukakuManager.js'
import { CommandInteractionManager } from './interactions/commandInteractions.js'
import { ButtonInteractionManager } from './interactions/buttonInteractions.js'
import { SelectMenuInteractionManager } from './interactions/selectMenuInteractions.js'
import { ShardClientUtil } from 'indomitable'
import { NodeOption } from 'shoukaku'

export interface CaptchaInfo {
  type: 'play' | 'search'
  query: string
  count?: number | null
  offset?: number | null
  url: string
  sid: string
  index: number
  captcha_key?: string
}

export interface PlayerTrackErrorTracker {
  count: number
  timer: NodeJS.Timeout
}

export class VkMusicBotClient extends Client {
  private exiting = false

  public captcha = new Collection<string, CaptchaInfo>()
  public timers = new Collection<string, NodeJS.Timeout>()
  public latestMenus = new Collection<string, Message>()
  public playerTrackErrorTrackers: Collection<string, PlayerTrackErrorTracker> = new Collection()

  public playerManager: PlayerManager
  public shoukaku: ShoukakuManager

  public commandInteractionManager: CommandInteractionManager
  public buttonInteractionManager: ButtonInteractionManager
  public selectMenuInteractionManager: SelectMenuInteractionManager

  constructor(options: ClientOptions) {
    if (!process.env.MONGO_URL || !process.env.REDIS_URL) throw new Error('Env not set')
    super(options)

    this.playerManager = new PlayerManager(this)
    this.shoukaku = new ShoukakuManager(this)
    this.commandInteractionManager = new CommandInteractionManager(this)
    this.buttonInteractionManager = new ButtonInteractionManager(this)
    this.selectMenuInteractionManager = new SelectMenuInteractionManager(this)

    this.once('ready', async () => {
      //this.manager.init(this.user?.id)
      //await this.initDb()
      // const slashCommandManager = new SlashCommandManager(this)
      // await slashCommandManager.init()
      logger.info(`Logged in as ${this.user?.tag} successfully`)

      await Promise.all([
        this.commandInteractionManager.load(),
        this.buttonInteractionManager.load(),
        this.selectMenuInteractionManager.load()
      ])

      logger.info(`Loaded ${this.commandInteractionManager.interactions.size} commands.`)
      logger.info(`Loaded ${this.buttonInteractionManager.interactions.size} button interactions.`)
    })
      // .on('guildDelete', (guild) => {
      //   logger.info({ guild_id: guild.id }, 'Bot leaves')
      //   this.queue.get(guild.id)?.destroy()

      //   Utils.clearExitTimeout(guild.id, this)
      // })
      // .on('messageDelete', (message) => {
      //   logger.debug({ message }, 'delete')
      //   if (!message.inGuild()) return

      //   const menuMessage = this.latestMenus.get(message.guildId)
      //   if (!menuMessage) return

      //   if (message.id === menuMessage.id) {
      //     this.latestMenus.delete(message.guildId)
      //     logger.info({ guild: message.guildId }, 'Removed latestMenusMessage')
      //   }
      // })

      .on('raw', (data) => {
        if (!data?.d?.guild_id || data.op !== 0 || data?.t !== 'MESSAGE_DELETE') return
        logger.debug({ data }, 'raw')

        const menuMessage = this.latestMenus.get(data.d.guild_id)
        if (!menuMessage) return

        if (data?.d?.id === menuMessage.id) {
          this.latestMenus.delete(data.d.guild_id)
          logger.info({ guildId: data.d.guild_id }, 'Removed latestMenusMessage')
        }
      })

      // TODO: fix this shit
      .on('voiceStateUpdate', async (oldState, newState) => {
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
            logger.debug({ guildId }, 'Player left')
            await player.safeDestroy()
            return
          }

          if (state === 'MOVED' && !config.enable247) {
            logger.debug({ guildId }, 'Player moved')
            voiceChannel = newState.channel
            const members = voiceChannel?.members.filter((m) => !m.user.bot)

            if (members?.size === 0) {
              channelIsEmpty = true
            }
          }
        } else {
          voiceChannel = oldState.channel || newState.channel
          if (!voiceChannel) return

          const members = voiceChannel.members.filter((m) => !m.user.bot)

          if (members.size === 0) {
            channelIsEmpty = true
          }
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

          logger.debug({ guildId: voiceChannel.guildId }, 'Player leaved empty channel')
        }
      })
  }

  async login(token?: string | undefined) {
    await super.login(token)

    await connectDb()
    logger.info('DB connected.')

    const shardClientUtil = this.shard as ShardClientUtil | null
    shardClientUtil?.on('message', (msg: any) => {
      if (msg?.content?.op === 'serverCount' && msg?.repliable) msg.reply(this.guilds.cache.size)
      else if (msg?.content?.op === 'clientId' && msg?.repliable) msg.reply(this.user?.id)
      else if (msg?.content?.op === 'setPresence') {
        this.user?.setPresence({
          activities: [
            {
              name: msg?.content?.data,
              type: 2
            }
          ]
        })
      } else if (msg?.content?.op === 'clearQueues') {
        for (const player of this.playerManager.values()) {
          player.stop()
        }
      } else if (msg?.content?.op === 'destroyAll') {
        for (const player of this.playerManager.values()) {
          player.safeDestroy()
        }
      } else if (msg?.content?.op === 'getLavalinkNodes' && msg?.repliable) {
        const nodes = []
        for (const node of this.shoukaku.nodes.values()) {
          nodes.push({
            name: node.name,
            state: node.state,
            penalties: node.penalties,
            stats: node.stats
          })
        }

        msg?.reply(nodes)
      } else if (msg?.content?.op === 'addLavalinkNode') {
        const node = msg.content.node as NodeOption
        this.shoukaku.addNode(node)
      } else if (msg?.content?.op === 'removeLavalinkNode' && msg?.repliable) {
        try {
          const node = msg.content.nodeName as string
          this.shoukaku.removeNode(node, 'API')
          msg.reply(true)
        } catch {
          msg.reply(false)
        }
      }
    })

    return this.constructor.name
  }

  async exit() {
    //
  }
}
