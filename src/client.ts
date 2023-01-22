/* eslint-disable @typescript-eslint/ban-ts-comment */
import { Client, ClientOptions, Collection, EmbedBuilder } from 'discord.js'
import Utils from './utils.js'
import logger from './logger.js'
import BotConfigDb from './botConfigDb.js'
import SlashCommandManager, { CommandType } from './slashCommandManager.js'
import { Events, Kazagumo, KazagumoError, Plugins } from 'kazagumo'
import { Connectors, NodeOption } from 'shoukaku'
import CustomPlayer from './kazagumo/CustomPlayer.js'
import { ShardClientUtil } from 'indomitable'

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
  //public slashOverwrites: Collection<string, CommandType> = new Collection()
  public captcha = new Collection<string, CaptchaInfo>()
  public timers = new Collection<string, NodeJS.Timeout>()
  //public cluster: Cluster.Client = new Cluster.Client(this)
  public db: BotConfigDb
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
    this.db = new BotConfigDb(process.env.MONGO_URL, process.env.REDIS_URL)

    this.once('ready', async () => {
      //this.manager.init(this.user?.id)
      await this.initDb()
      const slashCommandManager = new SlashCommandManager(this)
      await slashCommandManager.init()
      logger.info(`Loaded ${this.commands.size} commands.`)

      logger.info(`Logged in as ${this.user?.tag} successfully`)
    }).on('guildDelete', (guild) => {
      logger.info({ guild_id: guild.id }, 'Bot leaves')
      this.kazagumo.destroyPlayer(guild.id)

      const timer = this.timers.get(guild.id)
      if (timer) clearTimeout(timer)
    })

    // .on('voiceStateUpdate', (oldState, newState) => {
    //   logger.info({ newState: newState.channel?.members, oldState: oldState.channel?.members })
    // })

    this.kazagumo = new Kazagumo(
      {
        defaultSearchEngine: 'http',
        send: (id, payload) => {
          const guild = this.guilds.cache.get(id)
          guild?.shard.send(payload)
        },

        plugins: [new Plugins.PlayerMoved(this)],
        trackResolver: async function (this, options) {
          if (!this.kazagumo) throw new KazagumoError(1, 'Kazagumo is not set')
          const node = this.kazagumo.shoukaku.getNode('auto')

          if (!node) throw new KazagumoError(3, 'No node is available')

          this.kazagumo.emit(Events.Debug, `Resolving custom resolver track ${this.title}`)
          const result = await node.rest.resolve(this.uri).catch((_) => null)

          if (!result?.tracks[0]) throw new KazagumoError(2, 'No results found')

          const track = result.tracks[0]

          this.track = track.track
          this.realUri = track.info.uri
          this.length = track.info.length
          this.identifier = track.info.identifier
          this.isSeekable = track.info.isSeekable
          this.length = track.info.length
          this.isStream = track.info.isStream
          this.uri = track.info.uri

          return true
        },
        extends: {
          player: CustomPlayer
        }
      },
      new Connectors.DiscordJS(this),
      this.nodes,
      {
        reconnectTries: 128,
        reconnectInterval: 10000,
        restTimeout: 60000,
        moveOnDisconnect: true,
        // resume: true,
        // resumeKey: `kazagumo_cluster_${this.cluster.id}`,
        // resumeTimeout: 30000,
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
      })
      .on('disconnect', (name, players, moved) => {
        // logger.info({ guild_id: player.guild, shard_id: this.cluster.id }, 'moved player')
        // logger.info({ cur: player.voiceChannel, initChannel, newChannel })
        // player.pause(true)
        // setTimeout(() => player.pause(false), 2000)
        if (moved) {
          logger.info(`Node "${name}" moved`)
          return
        }
        logger.info({ shard: 0 }, `Node "${name}" disconnected.`)
        players.map((player) => player.connection.disconnect())
      })
      .on('debug', (name, info) => {
        logger.debug({ name, info }, 'Shoukaku debug')
      })

    this.kazagumo
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

      .on('playerStart', async (player, track) => {
        if (!(await this.db.getDisableAnnouncements(player.guildId))) {
          if (player.textId) {
            const channel = this.channels.cache.get(player.textId)

            if (!channel?.isTextBased()) return

            try {
              const message = await channel.send({
                embeds: [
                  new EmbedBuilder().setColor(0x5181b8).setAuthor({
                    name: `Сейчас играет ${Utils.escapeFormat(track.author)} — ${Utils.escapeFormat(track.title)}.`,
                    iconURL: track.thumbnail
                  })
                ]
              })

              setTimeout(async () => {
                try {
                  if (message.deletable) await message.delete()
                } catch (err) {
                  logger.error({ err }, "Can't delete message")
                }
              }, track.length)
            } catch {
              logger.error("Can't send message")
            }
          }
        }
      })
      .on('playerEmpty', async (player) => {
        logger.info({ guild_id: player.guildId }, 'End of queue')
        if (!(await this.db.get247(player.guildId)))
          if (player) {
            logger.info({ guild_id: player.guildId }, 'set timeout')
            this.timers.set(player.guildId, Utils.getExitTimeout(player, this))
          }
      })
      .on('playerMoved', (player, state, channels) => {
        if (state === 'LEFT') {
          logger.info({ guild_id: player.guildId }, 'player disconnected')

          const timer = this.timers.get(player.guildId)
          if (timer) clearTimeout(timer)

          player.destroy()
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

  async initDb() {
    await this.db.init()
  }

  async login(token?: string | undefined) {
    await super.login(token)

    setTimeout(() => {
      new Promise((resolve, reject) => {
        reject()
      })
    }, 5000)

    // @ts-ignore
    const shardClientUtil = this.shard as ShardClientUtil
    shardClientUtil.on('message', (msg) => {
      // @ts-ignore
      if (msg?.content?.op === 'serverCount' && msg?.repliable) msg.reply(this.guilds.cache.size)
      // @ts-ignore
      if (msg?.content?.op === 'clientId' && msg?.repliable) msg.reply(this.user.id)
      // @ts-ignore
      if (msg?.content?.op === 'setPresence') {
        this.user?.setPresence({
          activities: [
            {
              // @ts-ignore
              name: msg?.content?.data,
              type: 2
            }
          ]
        })
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
    await this.db.close()
    this.destroy()
  }
}
