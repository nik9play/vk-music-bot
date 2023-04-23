import { GatewayIntentBits, Options } from 'discord.js'
import { Indomitable, IndomitableOptions } from 'indomitable'
import { VkMusicBotClient } from '../client.js'
import logger from '../logger.js'
import cluster from 'cluster'
import { startApiServer } from './api/apiServer.js'

const options: IndomitableOptions = {
  // Processes to run
  clusterCount: parseInt(process.env.VK_TOTAL_SHARDS) / parseInt(process.env.SHARDS_PER_CLUSTER),
  // Websocket shards to run
  shardCount: parseInt(process.env.VK_TOTAL_SHARDS),
  // Discord.JS options
  clientOptions: {
    makeCache: Options.cacheWithLimits({
      ...Options.DefaultMakeCacheSettings,
      MessageManager: 0,
      //ThreadManager: 20,
      PresenceManager: 0,
      GuildStickerManager: 0,
      GuildBanManager: 0,
      GuildInviteManager: 0,
      GuildEmojiManager: 0,
      ReactionManager: 0,
      GuildScheduledEventManager: 0,
      AutoModerationRuleManager: 0
    }),
    intents: [GatewayIntentBits.Guilds, GatewayIntentBits.GuildVoiceStates, GatewayIntentBits.GuildMessages],
    rest: {
      api: process.env.DISCORD_PROXY_URL
    }
  },
  autoRestart: true,
  spawnTimeout: 120_000,
  client: VkMusicBotClient as any,
  token: process.env.DISCORD_TOKEN
}

export const manager = new Indomitable(options)
  .on('error', (err) => {
    logger.error({ err }, "Couldn't start shards")
  })
  .on('workerReady', (cluster) => {
    logger.info({ worker_id: cluster.id }, 'Worker ready')
  })
  .on('workerExit', (code, signal, cluster) => {
    logger.error({ worker_id: cluster.id, code, signal }, 'Worker exit')
  })
  .on('shardReady', (event) => {
    logger.info({ worker_id: event.clusterId, shard_id: event.shardId }, 'Shard ready')
  })
  .on('shardDisconnect', (event) => {
    logger.error({ worker_id: event.clusterId, shard_id: event.shardId }, 'Shard disconnect')
  })
  .on('shardReconnect', (event) => {
    logger.error({ worker_id: event.clusterId, shard_id: event.shardId }, 'Shard reconnect')
  })
  .on('debug', (event) => {
    logger.debug({ event }, 'Debug sharder')
  })

// .on('debug', (info) => {
//   logger.info({ info }, 'debug sharder')
// })

let clientId: string

async function sendStats() {
  const serverResults = await manager.ipc
    ?.broadcast({ content: { op: 'serverCount' }, repliable: true })
    .catch((err) => {
      logger.error({ err }, "Can't get server count.")
      return
    })

  if (!serverResults) return

  const serverSize: number = serverResults.reduce((acc, guildCount) => acc + guildCount, 0)

  console.log(serverSize)

  await manager.ipc
    ?.broadcast({ content: { op: 'setPresence', data: `/help | ${(serverSize / 1000).toFixed(1)}k серверов` } })
    .catch((err) => {
      logger.error({ err }, "Can't set presence.")
    })

  try {
    const res = await fetch('https://vk-api-v2.megaworld.space/metrics', {
      method: 'POST',
      body: JSON.stringify({
        token: process.env.API_TOKEN,
        metrics: {
          servers: serverSize,
          serverShards: serverResults
          //lavalinkInfo
        }
      })
    })
    const data = await res.json()
    if (!res.ok) {
      logger.error(`Send metrics error (http error). ${res.status}`)
      return
    }
    if (data.status === 'error') {
      logger.error('Error sending stats (server error)')
    } else {
      logger.info('Stats sent.')
    }
  } catch {
    logger.error('Send metrics error (request error).')
  }

  if (!clientId)
    clientId = await manager.ipc?.send(0, { content: { op: 'clientId' }, repliable: true }).catch((err) => {
      logger.error({ err }, "Can't get client id.")
      return
    })

  // SDC
  try {
    const res = await fetch(`https://api.server-discord.com/v2/bots/${clientId}/stats`, {
      method: 'POST',
      body: JSON.stringify({
        servers: serverSize,
        shards: manager.shardCount
      }),
      headers: {
        Authorization: 'SDC ' + process.env.SDC_TOKEN
      }
    })
    const data = await res.json()
    if (!res.ok) {
      logger.error(`Send stats error (http error). ${res.status}`)
      return
    }
    if (data.error) {
      logger.error('Error sending stats (server error)')
    } else {
      logger.info('Stats sent.')
    }
  } catch {
    logger.error('Error sending stats (connection error)')
  }

  // Boticord
  try {
    const res = await fetch(`https://api.boticord.top/v2/stats`, {
      method: 'POST',
      body: JSON.stringify({
        servers: serverSize,
        shards: manager.shardCount
      }),
      headers: {
        Authorization: 'Bot ' + process.env.BOTICORD_TOKEN
      }
    })
    const data = (await res.json()) as any
    if (!res.ok) {
      logger.error(`Send stats error (http error). ${res.status}`)
      return
    }
    if (data.error) {
      logger.error('Error sending stats (server error)')
    } else {
      logger.info('Stats sent.')
    }
  } catch {
    logger.error('Error sending stats (connection error)')
  }
}

async function startShardManager() {
  if (cluster.isPrimary) {
    //;['beforeExit', 'SIGUSR1', 'SIGUSR2', 'SIGINT', 'SIGTERM'].map((event) => process.once(event, exit.bind(event)))
    logger.info('Started spawning clusters.')
    startApiServer()
  }

  await manager.spawn()

  if (cluster.isPrimary) {
    logger.info('Finished spawning clusters.')
    sendStats().catch((err) => logger.error({ err }, "Can't send stats at start."))
    setInterval(
      () => sendStats().catch((err) => logger.error({ err }, "Can't send stats at interval.")),
      30 * 60 * 1000
    )
  }
}

async function exit() {
  logger.info('exit')
  process.exit()
}

// process.on('uncaughtException', (err, origin) => {
//   logger.error({ err, origin }, 'uncaughtException')
// })

// process.on('unhandledRejection', (reason, promise) => {
//   logger.error({ reason, promise }, 'unhandledRejection')
// })

cluster.on('exit', () => {
  console.log('huita...')
})

export { startShardManager }
