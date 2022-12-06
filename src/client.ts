import { Client, ClientOptions, Collection } from 'discord.js'
import Cluster from 'discord-hybrid-sharding-vk'
import { Manager, NodeOptions } from 'erela.js-vk'
import Utils from './utils.js'
import logger from './logger.js'
import BotConfigDb from './BotConfigDb.js'
import { CommandType } from './slashCommandManager.js'
import cross from 'discord-cross-ratelimit'
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
  public nodes?: NodeOptions[]
  public manager: Manager
  public playerTrackErrorTrackers: Collection<string, PlayerTrackErrorTracker> = new Collection()

  constructor(options: ClientOptions, nodes: NodeOptions[]) {
    super(options)

    Object.assign(this, { rest: new RequestManager(this, this.cluster) })

    this.nodes = nodes

    if (!process.env.MONGO_URL || !process.env.REDIS_URL) throw new Error('Env not set')
    this.db = new BotConfigDb(process.env.MONGO_URL, process.env.REDIS_URL)

    this.once('ready', () => {
      this.manager.init(this.user?.id)
      logger.info({ shard_id: this.cluster.id }, `Logged in as ${this.user?.tag} successfully`)
    })

    this.on('guildDelete', (guild) => {
      logger.info({ guild_id: guild.id, shard_id: this.cluster.id }, 'Bot leaves')
      const player = this.manager.get(guild.id)

      player?.destroy()

      const timer = this.timers.get(guild.id)
      if (timer) clearTimeout(timer)
    })

    this.on('raw', (d) => this.manager.updateVoiceState(d))

    this.manager = new Manager({
      nodes: this.nodes,
      send: (id, payload) => {
        const guild = this.guilds.cache.get(id)
        if (guild) guild.shard.send(payload)
      }
    })
      .on('nodeConnect', (node) =>
        logger.info({ shard: this.cluster.id }, `Node "${node.options.identifier}" connected.`)
      )
      .on('nodeError', (node, error) =>
        logger.error(
          { shard: this.cluster.id },
          `Node "${node.options.identifier}" encountered an error: ${error.message}.`
        )
      )
      .on('nodeDisconnect', (node) => {
        logger.info({ shard: this.cluster.id }, `Node "${node.options.identifier}" disconnected.`)
      })
      .on('nodeReconnect', (node) => {
        logger.info({ shard: this.cluster.id }, `Node "${node.options.identifier}" reconnected.`)
      })
      .on('trackStart', async (player, track) => {
        if (!(await this.db.getDisableAnnouncements(player.guild))) {
          if (player.textChannel) {
            const channel = this.channels.cache.get(player.textChannel)

            if (channel?.isText() && track?.author && track?.title) {
              try {
                const message = await channel.send({
                  embeds: [
                    {
                      description: `Сейчас играет **${Utils.escapeFormat(track.author)} — ${Utils.escapeFormat(
                        track.title
                      )}**.`,
                      color: 0x5181b8
                    }
                  ]
                })

                setTimeout(async () => {
                  try {
                    await message.delete()
                  } catch (err) {
                    logger.error({ err }, "Can't delete message")
                  }
                }, track.duration)
              } catch {
                logger.error("Can't send message")
              }
            }
          }
        }
      })
      .on('queueEnd', async (player) => {
        logger.info({ guild_id: player.guild, shard_id: this.cluster.id }, 'End of queue')
        if (!(await this.db.get247(player.guild)))
          if (player) {
            logger.info({ guild_id: player.guild, shard_id: this.cluster.id }, 'set timeout')
            this.timers.set(player.guild, Utils.getExitTimeout(player, this))
          }
      })
      .on('playerMove', (player) => {
        logger.info({ guild_id: player.guild, shard_id: this.cluster.id }, 'moved player')
        player.pause(true)
        setTimeout(() => player.pause(false), 2000)
      })
      .on('playerDisconnect', (player) => {
        logger.info({ guild_id: player.guild, shard_id: this.cluster.id }, 'player disconnected')

        const timer = this.timers.get(player.guild)
        if (timer) clearTimeout(timer)

        player.destroy()
      })
      .on('playerDestroy', (player) => {
        logger.info({ guild_id: player.guild, shard_id: this.cluster.id }, 'player destroyed')
      })
      .on('socketClosed', async (player, socket) => {
        logger.debug({ code: socket.code, guild_id: player.guild }, 'socket closed')
      })
      .on('trackStuck', (guildId) => {
        logger.warn({ guild_id: guildId, shard_id: this.cluster.id }, 'track stuck')
      })
      .on('trackError', (player, track, payload) => {
        logger.error(
          {
            error: payload.exception?.message,
            guild_id: player.guild,
            shard_id: this.cluster.id,
            name: track.title,
            author: track.author,
            url: track.uri
          },
          'Track error'
        )
        // const channel = client.channels.cache.get(player.textChannel)
        // channel.send({embed: {
        //   description: `С треком **${track.author} — ${track.title}** произошла проблема, поэтому он был пропущен.`,
        //   color: 0x5181b8
        // }}).then(msg => msg.delete({timeout: 30000}).catch(console.error)).catch(console.error)

        const tracker = this.playerTrackErrorTrackers.get(player.guild)
        if (tracker) {
          tracker.count += 1
          clearTimeout(tracker.timer)
          tracker.timer = setTimeout(() => {
            this.playerTrackErrorTrackers.delete(player.guild)
          }, 30 * 1000)

          if (tracker.count >= 5) {
            player?.queue.clear()
            clearTimeout(tracker.timer)
            this.playerTrackErrorTrackers.delete(player.guild)
          }
        } else {
          this.playerTrackErrorTrackers.set(player.guild, {
            count: 1,
            timer: setTimeout(() => {
              this.playerTrackErrorTrackers.delete(player.guild)
            }, 30000)
          })
        }
      })
  }

  async initDb() {
    await this.db.init()
  }
}
