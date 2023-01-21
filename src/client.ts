import { Client, ClientOptions, Collection, EmbedBuilder } from 'discord.js'
import Cluster from 'discord-hybrid-sharding-vk'
import Utils from './utils.js'
import logger from './logger.js'
import BotConfigDb from './botConfigDb.js'
import { CommandType } from './slashCommandManager.js'
import cross from 'discord-cross-ratelimit'
import { Events, Kazagumo, KazagumoError, Plugins } from 'kazagumo'
import { Connectors, NodeOption } from 'shoukaku'
import CustomPlayer from './kagazumo/CustomPlayer.js'
const { RequestManager } = cross

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
  //public cooldowns: Collection<string, any> = new Collection()
  public commands: Collection<string, CommandType> = new Collection()
  //public slashOverwrites: Collection<string, CommandType> = new Collection()
  public captcha: Collection<string, CaptchaInfo> = new Collection()
  public timers: Collection<string, NodeJS.Timeout> = new Collection()
  public cluster: Cluster.Client = new Cluster.Client(this)
  public db: BotConfigDb
  public nodes?: NodeOption[]
  public kagazumo: Kazagumo
  public playerTrackErrorTrackers: Collection<string, PlayerTrackErrorTracker> = new Collection()

  constructor(options: ClientOptions, nodes: NodeOption[]) {
    super(options)

    Object.assign(this, { rest: new RequestManager(this, this.cluster) })

    this.nodes = nodes

    if (!process.env.MONGO_URL || !process.env.REDIS_URL) throw new Error('Env not set')
    this.db = new BotConfigDb(process.env.MONGO_URL, process.env.REDIS_URL)

    this.once('ready', () => {
      //this.manager.init(this.user?.id)
      logger.info({ shard_id: this.cluster.id }, `Logged in as ${this.user?.tag} successfully`)
    })

    this.on('guildDelete', (guild) => {
      logger.info({ guild_id: guild.id, shard_id: this.cluster.id }, 'Bot leaves')
      this.kagazumo.destroyPlayer(guild.id)

      const timer = this.timers.get(guild.id)
      if (timer) clearTimeout(timer)
    })
    // .on('voiceStateUpdate', (oldState, newState) => {
    //   logger.info({ newState: newState.channel?.members, oldState: oldState.channel?.members })
    // })

    //this.on('raw', (d) => this.manager.updateVoiceState(d))

    this.kagazumo = new Kazagumo(
      {
        defaultSearchEngine: 'http',
        send: (id, payload) => {
          const guild = this.guilds.cache.get(id)
          if (guild) guild.shard.send(payload)
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

    this.kagazumo.shoukaku
      .on('ready', (node) => {
        logger.info({ shard: this.cluster.id }, `Node "${node}" connected.`)
      })
      .on('error', (node, error) =>
        logger.error({ shard: this.cluster.id }, `Node "${node}" encountered an error: ${error.message}.`)
      )
      .on('close', (node, code, reason) => {
        logger.info({ shard: this.cluster.id }, `Node "${node}" closed [${code}] [${reason}].`)
      })
      .on('disconnect', (name, players, moved) => {
        // logger.info({ guild_id: player.guild, shard_id: this.cluster.id }, 'moved player')
        // logger.info({ cur: player.voiceChannel, initChannel, newChannel })
        // player.pause(true)
        // setTimeout(() => player.pause(false), 2000)
        if (moved) {
          logger.info({ shard_id: this.cluster.id }, `Node "${name}" moved`)
          return
        }
        logger.info({ shard: this.cluster.id }, `Node "${name}" disconnected.`)
        players.map((player) => player.connection.disconnect())
      })
      .on('debug', (name, info) => {
        logger.info({ name, info })
      })
    // .on('nodeReconnect', (node) => {
    //   logger.info({ shard: this.cluster.id }, `Node "${node.options.identifier}" reconnected.`)
    // })
    this.kagazumo
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
        logger.info({ guild_id: player.guildId, shard_id: this.cluster.id }, 'End of queue')
        if (!(await this.db.get247(player.guildId)))
          if (player) {
            logger.info({ guild_id: player.guildId, shard_id: this.cluster.id }, 'set timeout')
            this.timers.set(player.guildId, Utils.getExitTimeout(player, this))
          }
      })
      .on('playerMoved', (player, state, channels) => {
        if (state === 'LEFT') {
          logger.info({ guild_id: player.guildId, shard_id: this.cluster.id }, 'player disconnected')

          const timer = this.timers.get(player.guildId)
          if (timer) clearTimeout(timer)

          player.destroy()
        }

        if (state === 'MOVED') {
          logger.info(
            { guild_id: player.guildId, shard_id: this.cluster.id },
            `player moved new: ${channels.newChannelId}, old: ${channels.oldChannelId}`
          )
        }
      })
      .on('playerDestroy', (player) => {
        logger.info({ guild_id: player.guildId, shard_id: this.cluster.id }, 'player destroyed')
      })
      .on('playerStuck', (player, state) => {
        logger.warn({ guild_id: state.guildId, shard_id: this.cluster.id }, `Track stuck ${state.type}`)
      })
      .on('playerResolveError', (player, track, message) => {
        logger.error(
          {
            error: message,
            guild_id: player.guildId,
            shard_id: this.cluster.id,
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
      .on('debug', (obg) => {
        logger.info(obg)
      })
  }

  async initDb() {
    await this.db.init()
  }
}
