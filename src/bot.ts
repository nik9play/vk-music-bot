import { Options, GatewayIntentBits, Partials } from 'discord.js'
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

const client = new VkMusicBotClient(
  {
    makeCache: Options.cacheWithLimits({
      ...Options.DefaultMakeCacheSettings,
      MessageManager: 50,
      PresenceManager: 0,
      ThreadManager: 20
    }),
    shards: Cluster.Client.getInfo().SHARD_LIST,
    shardCount: Cluster.Client.getInfo().TOTAL_SHARDS,
    intents: [GatewayIntentBits.Guilds, GatewayIntentBits.GuildVoiceStates, GatewayIntentBits.GuildMessages]
  },
  nodes
)

await client.initDb()
logger.info('DB initialized.')

const slashCommandManager = new SlashCommandManager(client)
await slashCommandManager.init()
logger.info(`Loaded ${client.commands.size} commands.`)

await client.login(process.env.DISCORD_TOKEN)
