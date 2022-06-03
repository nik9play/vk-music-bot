import { Client, ClientOptions, Collection } from 'discord.js'
import Cluster from 'discord-hybrid-sharding-vk'
import { Manager } from 'erela.js-vk'
import { NodeOptions } from 'erela.js-vk/structures/Node'
import Utils from './Utils'
import logger from './Logger'
import db from './DB'
import { CommandType } from './SlashCommandManager'
import { RequestManager } from 'discord-cross-ratelimit'

export interface CaptchaInfo {
  type: 'play' | 'search',
  args: string[]
  url: string,
  sid: string,
  index: number,
  captcha_key?: string
}

export class VkMusicBotClient extends Client {
  public cooldowns: Collection<string, any> = new Collection()
  public commands: Collection<string, CommandType> = new Collection()
  public slashOverwrites: Collection<string, CommandType> = new Collection()
  public captcha: Collection<string, CaptchaInfo> = new Collection()
  public timers: Collection<string, NodeJS.Timeout> = new Collection()
  public cluster: Cluster.Client = new Cluster.Client(this)
  public db: any
  public nodes?: NodeOptions[]
  public manager: Manager

  constructor(options: ClientOptions, nodes: NodeOptions[]) {
    super(options)

    Object.assign(this, { rest: new RequestManager(this, this.cluster) })

    this.nodes = nodes

    if (!process.env.MONGO_URL || !process.env.REDIS_URL)
      throw new Error('Env not set')
    this.db = new db(process.env.MONGO_URL, process.env.REDIS_URL)
    this.db.init()

    this.manager = new Manager({
      nodes: this.nodes,
      send: (id, payload) => {
        const guild = this.guilds.cache.get(id)
        if (guild) guild.shard.send(payload)
      }
    })
      .on('nodeConnect', node => logger.info({ shard: this.cluster.id }, `Node "${node.options.identifier}" connected.`))
      .on('nodeError', (node, error) => logger.error(
        `Node "${node.options.identifier}" encountered an error: ${error.message}.`
      ))
      .on('trackStart', async (player, track) => {
        if (!await this.db.getDisableAnnouncements(player.guild)) {
          if (player.textChannel) {
            const channel = this.channels.cache.get(player.textChannel)

            if (channel?.isText() && track?.author && track?.title) {
              try {
                const message = await channel.send({
                  embeds: [{
                    description: `Сейчас играет **${Utils.escapeFormat(track.author)} — ${Utils.escapeFormat(track.title)}**.`,
                    color: 0x5181b8
                  }]
                })

                setTimeout(() => {
                  if (message && typeof message.delete === 'function') {
                    message.delete().catch(err => logger.error({ err }, 'Can\'t delete message'))
                  }
                }, track.duration)
              } catch {
                logger.error('Can\'t send message')
              }
            }
          }
        }
      })
      .on('queueEnd', async (player) => {
        logger.info({ guild_id: player.guild, shard_id: this.cluster.id }, 'End of queue')
        if (!await this.db.get247(player.guild))
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
        if (timer)
          clearTimeout(timer)

        player.destroy()
      })
      .on('playerDestroy', (player) => {
        logger.info({ guild_id: player.guild, shard_id: this.cluster.id }, 'player destroyed')
      })
      .on('socketClosed', async (player, socket) => {
        // reconnect on "Abnormal closure"
        if (socket.code == 1006) {
          logger.warn({
            guild_id: player.guild,
            shard_id: this.cluster.id
          }, 'caught Abnormal closure, trying to reconnect...')
          const voiceChannel = player.voiceChannel
          const textChannel = player.textChannel

          try {
            player.disconnect()
          } catch {
            //
          }

          if (voiceChannel && textChannel) {
            setTimeout(() => {
              player.setVoiceChannel(voiceChannel)
              player.setTextChannel(textChannel)

              player.connect()
              setTimeout(() => {
                player.pause(false)
              }, 500)
            }, 500)
          }
        }

        logger.debug({ code: socket.code, guild_id: player.guild }, 'socket closed')
      })
      .on('trackStuck', (guildId) => {
        logger.warn({ guild_id: guildId, shard_id: this.cluster.id }, 'track stuck')
      })
      .on('trackError', (player, track) => {
        // const channel = client.channels.cache.get(player.textChannel)
        // channel.send({embed: {
        //   description: `С треком **${track.author} — ${track.title}** произошла проблема, поэтому он был пропущен.`,
        //   color: 0x5181b8
        // }}).then(msg => msg.delete({timeout: 30000}).catch(console.error)).catch(console.error)
        logger.warn({ guild_id: player.guild, shard_id: this.cluster.id, track }, 'Track error')
      })
  }
}