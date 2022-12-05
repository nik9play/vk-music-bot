import { Intents, Options } from 'discord.js'
import { VkMusicBotClient } from './client.js'
import Cluster from 'discord-hybrid-sharding-vk'

import SlashCommandManager from './slashCommandManager.js'
import logger from './logger.js'
import { NodeOptions } from 'erela.js-vk'

const LavalinkServersString = process.env.LAVALINK_NODES

if (LavalinkServersString == null) throw new Error('poshel ti')

const nodes: NodeOptions[] = LavalinkServersString.split(';').map((val): NodeOptions => {
  const arr = val.split(',')
  return {
    host: arr[1],
    port: parseInt(arr[2]),
    password: arr[3],
    retryAmount: 128
  }
})

console.log({ nodes })

const client = new VkMusicBotClient(
  {
    makeCache: Options.cacheWithLimits({
      ...Options.defaultMakeCacheSettings,
      MessageManager: 50,
      PresenceManager: 0,
      ThreadManager: 20
    }),
    shards: Cluster.Client.getInfo().SHARD_LIST,
    shardCount: Cluster.Client.getInfo().TOTAL_SHARDS,
    intents: [Intents.FLAGS.GUILDS, Intents.FLAGS.GUILD_VOICE_STATES, Intents.FLAGS.GUILD_MESSAGES]
  },
  nodes
)

client.once('ready', () => {
  client.manager.init(client.user?.id)
  logger.info({ shard_id: client.cluster.id }, `Logged in as ${client.user?.tag} successfully`)
})

client.on('raw', (d) => client.manager.updateVoiceState(d))

client.on('guildDelete', (guild) => {
  logger.info({ guild_id: guild.id, shard_id: client.cluster.id }, 'Bot leaves')
  const player = client.manager.get(guild.id)

  if (player) player.destroy()

  const timer = client.timers.get(guild.id)
  if (timer) clearTimeout(timer)
})

await client.initDb()
logger.info('DB initialized.')

const slashCommandManager = new SlashCommandManager(client)
await slashCommandManager.init()
logger.info(`Loaded ${client.commands.size} commands.`)

await client.login(process.env.DISCORD_TOKEN)
