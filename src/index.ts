import { Intents, Options } from 'discord.js'
import { VkMusicBotClient } from './client'
import Cluster from 'discord-hybrid-sharding-vk'

import SlashCommandManager from './SlashCommandManager'
import logger from './Logger'
import { NodeOptions } from 'erela.js-vk/structures/Node'

const LavalinkServersString = process.env.LAVALINK_NODES

if (LavalinkServersString == null) throw new Error('poshel ti')

const nodes: NodeOptions[] = LavalinkServersString.split(';').map((val): NodeOptions => {
  const arr = val.split(',')
  return {
    host: arr[1],
    port: parseInt(arr[2]),
    password: arr[3]
  }
})

console.log({ nodes })

const client = new VkMusicBotClient({
  makeCache: Options.cacheWithLimits({
    ...Options.defaultMakeCacheSettings,
    MessageManager: 5,
    PresenceManager: 0,
    ThreadManager: 0
  }),
  shards: Cluster.data.SHARD_LIST,
  shardCount: Cluster.data.TOTAL_SHARDS,
  intents: [Intents.FLAGS.GUILDS, Intents.FLAGS.GUILD_VOICE_STATES, Intents.FLAGS.GUILD_MESSAGES]
}, nodes)

const slashCommandManager = new SlashCommandManager(client)
slashCommandManager.init()

client.once('ready', () => {
  client.manager.init(client.user?.id)
  logger.info({ shard_id: client.cluster.id }, `Logged in as ${client.user?.tag}`)
})

client.on('raw', d => client.manager.updateVoiceState(d))

client.on('guildDelete', (guild) => {
  logger.info({ guild_id: guild.id, shard_id: client.cluster.id }, 'bot leaves')
  const player = client.manager.get(guild.id)

  if (player) player.destroy()

  const timer = client.timers.get(guild.id)
  if (timer)
    clearTimeout(timer)
})

client.login(process.env.DISCORD_TOKEN)