/* eslint-disable @typescript-eslint/ban-ts-comment */
import { Client, ClientOptions, Collection, Message } from 'discord.js'
import Utils, { ErrorMessageType } from './utils.js'
import logger from './logger.js'
import SlashCommandManager, { ButtonCustomInteraction, CommandType } from './slashCommandManager.js'
import { Events, Kazagumo, KazagumoError, Plugins } from 'kazagumo'
import { Connectors, NodeOption } from 'shoukaku'
import CustomPlayer from './kazagumo/CustomPlayer.js'
import { ShardClientUtil } from 'indomitable'
import { connectDb, getConfig } from './db.js'
import playerStart, { deletePreviousTrackStartMessage } from './events/kazagumo/playerStart.js'
import generatePlayerStartMessage from './helpers/playerStartHelper.js'

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

  //public cooldowns: Collection<string, any> = new Collection()
  public commands = new Collection<string, CommandType>()
  public buttonInteractions = new Collection<string, ButtonCustomInteraction>()
  //public slashOverwrites: Collection<string, CommandType> = new Collection()
  public captcha = new Collection<string, CaptchaInfo>()
  public timers = new Collection<string, NodeJS.Timeout>()
  public latestMenus = new Collection<string, Message>()
  //public latestMenusTimeouts = new Collection<string, NodeJS.Timeout>()
  //public cluster: Cluster.Client = new Cluster.Client(this)
  public nodes?: NodeOption[]
  public kazagumo: Kazagumo
  public playerTrackErrorTrackers: Collection<string, PlayerTrackErrorTracker> = new Collection()

  constructor(options: ClientOptions) {
    super(options)

    const LavalinkServersString = process.env.LAVALINK_NODES

    if (LavalinkServersString == null) throw new Error('Node env is null.')

    const nodes: NodeOption[] = LavalinkServersString.split(';').map((val): NodeOption => {
      const arr = val.split(',')
      return {
        name: arr[0],
        url: `${arr[1]}:${arr[2]}`,
        auth: arr[3],
        secure: false
      }
    })

    this.nodes = nodes

    if (!process.env.MONGO_URL || !process.env.REDIS_URL) throw new Error('Env not set')
    //this.db = new BotConfigDb(process.env.MONGO_URL, process.env.REDIS_URL)

    this.once('ready', async () => {
      //this.manager.init(this.user?.id)
      //await this.initDb()
      const slashCommandManager = new SlashCommandManager(this)
      await slashCommandManager.init()
      logger.info(`Loaded ${this.commands.size} commands.`)
      logger.info(`Loaded ${this.buttonInteractions.size} button interactions.`)

      logger.info(`Logged in as ${this.user?.tag} successfully`)
    })
      .on('guildDelete', (guild) => {
        logger.info({ guild_id: guild.id }, 'Bot leaves')
        this.kazagumo.destroyPlayer(guild.id)

        Utils.clearExitTimeout(guild.id, this)
      })

      .on('messageDelete', (message) => {
        if (!message.inGuild()) return

        const menuMessage = this.latestMenus.get(message.guildId)
        if (!menuMessage) return

        if (message.id === menuMessage.id) {
          this.latestMenus.delete(message.guildId)
          logger.info('removed latestMenusMessage')
        }
      })

      // TODO: fix this shit
      .on('voiceStateUpdate', async (oldState, newState) => {
        logger.info({ newState: newState.channel, oldState: oldState.channel })
        const voiceChannel = oldState.channel || newState.channel
        if (!voiceChannel) return

        const config = await getConfig(voiceChannel.guildId)

        if (config.enable247) return

        const members = voiceChannel.members.filter((m) => !m.user.bot)
        if (members.size === 0) {
          const player = this.kazagumo.getPlayer(voiceChannel.guildId)
          if (!player) return

          const textId = player.textId

          await deletePreviousTrackStartMessage(this, player)
          player.destroy()

          const channel = this.channels.cache.get(textId)
          if (!channel?.isTextBased()) return

          Utils.sendMessageToChannel(
            channel,
            {
              embeds: [
                Utils.generateErrorMessage(
                  'Я вышел из канала, так как тут никого не осталось. Включите режим 24/7 (/247), если не хотите, чтобы это происходило.',
                  ErrorMessageType.Info
                )
              ]
            },
            20000
          )
        }
      })

    this.kazagumo = new Kazagumo(
      {
        defaultSearchEngine: 'http',
        send: (id, payload) => {
          const guild = this.guilds.cache.get(id)
          guild?.shard.send(payload)
        },

        plugins: [new Plugins.PlayerMoved(this)],
        trackResolver: async function (this, options) {
          // if (!this.kazagumo) throw new KazagumoError(1, 'Kazagumo is not set')
          // const node = this.kazagumo.shoukaku.getNode('auto')

          // if (!node) throw new KazagumoError(3, 'No node is available')

          // this.kazagumo.emit(Events.Debug, `Resolving custom resolver track ${this.title}`)
          // const result = await node.rest.resolve(this.uri).catch((_) => null)

          // if (!result?.tracks[0]) throw new KazagumoError(2, 'No results found')

          // const track = result.tracks[0]

          // this.track = track.track
          // this.realUri = track.info.uri
          // this.length = track.info.length
          // this.identifier = track.info.identifier
          // this.isSeekable = track.info.isSeekable
          // this.length = track.info.length
          // this.isStream = track.info.isStream
          // this.uri = track.info.uri

          return true
        },
        extends: {
          player: CustomPlayer
        }
      },
      new Connectors.DiscordJS(this),
      this.nodes,
      {
        reconnectTries: 1,
        reconnectInterval: 10,
        restTimeout: 60,
        moveOnDisconnect: false,
        resume: false,
        resumeKey: `kazagumo_cluster_${this.shard?.ids[0]}`,
        resumeTimeout: 30,
        resumeByLibrary: false
      }
    )

    this.kazagumo.shoukaku
      .on('ready', (node) => {
        logger.info({ shard: 0 }, `Node "${node}" connected.`)
      })
      .on('error', (node, error) =>
        logger.error({ shard: 0 }, `Node "${node}" encountered an error: ${error.message}.`)
      )
      .on('close', (node, code, reason) => {
        logger.info({ shard: 0 }, `Node "${node}" closed [${code}] [${reason}].`)

        this.kazagumo.shoukaku.nodes.get(node)
        //this.kazagumo.shoukaku.getNode(node)?.players.get('713734408930197524')?.clean()
      })
      .on('disconnect', (name, moved, count) => {
        // logger.info({ guild_id: player.guild, shard_id: this.cluster.id }, 'moved player')
        // logger.info({ cur: player.voiceChannel, initChannel, newChannel })
        // player.pause(true)
        // setTimeout(() => player.pause(false), 2000)
        if (moved) {
          logger.info(`Node "${name}" moved`)
          return
        }
        logger.info({ shard: 0, count }, `Node "${name}" disconnected.`)
        logger.info(this.kazagumo.shoukaku.players.get("713734408930197524"))
        logger.info(this.kazagumo.getPlayer("713734408930197524")?.shoukaku)
        //console.log(this.kazagumo.shoukaku.getNode(name))
        //players.map((player) => player.connection.disconnect())
      })
      .on('debug', (name, info) => {
        logger.debug({ name, info }, 'Shoukaku debug')
      })

    this.kazagumo
      .on('playerClosed', (player) => {
        console.log('kal1 ', player)
      })
      .on('playerException', (player, data) => {
        console.log('kal2 ', player, data)
      })
      // .on('playerEnd', async (player, track) => {
      //   if (await this.db.get247(player.guild)) return
      //   if (!player?.voiceChannel) return
      //   const voiceChannel = this.channels.cache.get(player.voiceChannel)
      //   if (!voiceChannel?.isVoice()) return

      //   const memberCount = voiceChannel.members.filter((member) => !member.user.bot).size

      //   logger.info({ memberCount })

      //   if (memberCount === 0) {
      //     player.queue.clear()
      //     player.stop()

      //     if (!player.textChannel) return

      //     const textChannel = this.channels.cache.get(player.textChannel)
      //     if (!textChannel?.isText()) return

      //     try {
      //       const message = await textChannel.send({
      //         embeds: [
      //           Utils.generateErrorMessage(
      //             'Бот скоро выйдет из канала, так как в нём никого нет. Если хотите, чтобы бот оставался, приобретите **Премиум** и включите режим 24/7. Подробности: `/donate`.',
      //             ErrorMessageType.Info
      //           )
      //         ]
      //       })

      //       setTimeout(async () => {
      //         try {
      //           if (message.deletable) await message.delete()
      //         } catch (err) {
      //           logger.error({ err }, "Can't delete message")
      //         }
      //       }, 30000)
      //     } catch {
      //       logger.error("Can't send message")
      //     }
      //   }
      // })

      .on('playerUpdate', async (player, track) => {
        logger.info({ track: track.state.position, player: player.position })
        if (player.position >= 7_000 && player?.queue.current && !player.paused) {
          const message = this.latestMenus.get(player.guildId)
          if (!message) return

          if (message.editable)
            message
              .edit(generatePlayerStartMessage(player, player.queue.current))
              .catch((err) => logger.error({ err }, "Can't edit player start message"))
        }
      })
      .on('playerStart', playerStart.bind(null, this))
      .on('playerEmpty', async (player) => {
        logger.info({ guild_id: player.guildId }, 'End of queue')
        const config = await getConfig(player.guildId)

        if (!config.enable247)
          if (player) {
            Utils.setExitTimeout(player, this)
          }

        deletePreviousTrackStartMessage(this, player)
      })
      .on('playerMoved', (player, state, channels) => {
        if (state === 'LEFT') {
          logger.info({ guild_id: player.guildId }, 'player disconnected')

          Utils.clearExitTimeout(player.guildId, this)

          deletePreviousTrackStartMessage(this, player)

          // if (player.shoukaku.connection.state !== )
          // player.destroy()
        }

        if (state === 'MOVED') {
          logger.info(
            { guild_id: player.guildId },
            `player moved new: ${channels.newChannelId}, old: ${channels.oldChannelId}`
          )
        }
      })
      .on('playerDestroy', (player) => {
        logger.info({ guild_id: player.guildId }, 'player destroyed')
        Utils.clearExitTimeout(player.guildId, this)
        deletePreviousTrackStartMessage(this, player)
      })
      .on('playerStuck', (player, state) => {
        logger.warn({ guild_id: state.guildId }, `Track stuck ${state.type}`)
      })
      .on('playerResolveError', (player, track, message) => {
        logger.error(
          {
            error: message,
            guild_id: player.guildId,
            name: track.title,
            author: track.author,
            url: track.uri
          },
          'Track resolve error'
        )
        // const channel = client.channels.cache.get(player.textChannel)
        // channel.send({embed: {
        //   description: `С треком **${track.author} — ${track.title}** произошла проблема, поэтому он был пропущен.`,
        //   color: 0x5181b8
        // }}).then(msg => msg.delete({timeout: 30000}).catch(console.error)).catch(console.error)

        const tracker = this.playerTrackErrorTrackers.get(player.guildId)
        if (tracker) {
          tracker.count += 1
          clearTimeout(tracker.timer)
          tracker.timer = setTimeout(() => {
            this.playerTrackErrorTrackers.delete(player.guildId)
          }, 30 * 1000)

          if (tracker.count >= 5) {
            player?.queue.clear()
            clearTimeout(tracker.timer)
            this.playerTrackErrorTrackers.delete(player.guildId)
          }
        } else {
          this.playerTrackErrorTrackers.set(player.guildId, {
            count: 1,
            timer: setTimeout(() => {
              this.playerTrackErrorTrackers.delete(player.guildId)
            }, 30000)
          })
        }
      })
      // eslint-disable-next-line @typescript-eslint/ban-ts-comment
      //@ts-ignore
      .on('debug', (obj) => {
        logger.debug({ obj }, 'Kazagumo debug.')
      })
    //;['beforeExit', 'SIGUSR1', 'SIGUSR2', 'SIGINT', 'SIGTERM'].map((event) => process.once(event, this.exit.bind(this)))
  }

  // async initDb() {
  //   await this.db.init()
  // }

  async login(token?: string | undefined) {
    await super.login(token)

    // setTimeout(() => {
    //   new Promise((resolve, reject) => {
    //     reject()
    //   })
    // }, 5000)

    await connectDb()
    logger.info('DB connected.')

    // @ts-ignore
    const shardClientUtil = this.shard as ShardClientUtil
    shardClientUtil.on('message', (msg: any) => {
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
        for (const player of this.kazagumo.players.values()) {
          player.setLoop('none')
          player.queue.clear()
        }
      } else if (msg?.content?.op === 'destroyAll') {
        for (const player of this.kazagumo.players.values()) {
          player.destroy()
        }
      }
    })

    return this.constructor.name
  }

  async exit() {
    this.exiting = true
    if (this.exiting) return

    logger.info('Cluster shutting down...')

    for (const player of this.kazagumo.players.values()) {
      player.destroy()
    }
    //await this.db.close()
    this.destroy()
  }
}
