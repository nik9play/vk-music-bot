import { GatewayIntentBits, Options, Partials } from 'discord.js'
import { Indomitable, IndomitableOptions } from 'indomitable'
import { VkMusicBotClient } from '../client.js'
import logger from '../logger.js'
import cluster from 'cluster'
import { startApiServer } from './api/apiServer.js'
import { fetch } from 'undici'
import { Influx } from '../modules/analytics.js'
import { Point } from '@influxdata/influxdb-client'
import { ClusterInfo } from '../events/ipc/clustersInfo.js'
import { NodeInfo } from '../events/ipc/getLavalinkNodes.js'

const options: IndomitableOptions = {
  // Processes to run
  clusterCount: parseInt(process.env.VK_TOTAL_SHARDS) / parseInt(process.env.SHARDS_PER_CLUSTER),
  // Websocket shards to run
  shardCount: parseInt(process.env.VK_TOTAL_SHARDS),
  // Discord.JS options
  clientOptions: {
    allowedMentions: { parse: ['roles', 'users'] },
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
      AutoModerationRuleManager: 0,
      // GuildMemberManager: {
      //   maxSize: 1,
      //   keepOverLimit: (member) => member.id === process.env.CLIENT_ID
      // },
      UserManager: {
        maxSize: 1,
        keepOverLimit: (user) => user.id === user.client.user.id
      }
    }),

    sweepers: {
      ...Options.DefaultSweeperSettings,
      guildMembers: {
        interval: 1800,
        filter: () => (member) =>
          // remove GuildMember from cache if it is not in voice channel
          // (member.user.bot && member.id !== member.client.user.id) ||
          // (!member.voice.channelId && !member.user.bot) ||
          // (!!member.voice.channelId &&
          //   member.voice.channelId !== member.guild.members.me?.voice.channelId &&
          //   !member.user.bot)
          (member.user.bot && member.id !== member.client.user.id) ||
          (!member.voice.channelId && !member.user.bot)
      },
      users: {
        interval: 1800,
        filter: () => (user) => user.bot && user.id !== user.client.user.id
      },
      voiceStates: {
        interval: 1800,
        filter: () => (voice) => !voice.channelId && voice.id !== voice.client.user.id
      }
    },
    partials: [
      Partials.GuildMember,
      Partials.Message,
      Partials.ThreadMember,
      Partials.User,
      Partials.Channel
    ],
    intents: [
      GatewayIntentBits.Guilds,
      GatewayIntentBits.GuildVoiceStates,
      GatewayIntentBits.GuildMessages
    ],

    rest: {
      api: process.env.DISCORD_PROXY_URL,
      timeout: 30_000
    }
  },
  autoRestart: true,
  spawnTimeout: 120_000,
  client: VkMusicBotClient as any,
  handleConcurrency: true,
  waitForReady: false,
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
    logger.info({ worker_id: event.clusterId, shard_id: event.shardId }, 'Shard reconnect')
  })
  .on('debug', (event) => {
    logger.debug({ event }, 'Debug sharder')
  })

// .on('debug', (info) => {
//   logger.info({ info }, 'debug sharder')
// })

// manager.on('message', async (msg: any) => {
//   if (msg?.content?.op === 'serverCount' && msg?.repliable) {
//     const serverResults = await manager.ipc
//       ?.broadcast({ content: { op: 'serverCount' }, repliable: true })
//       .catch((err) => {
//         logger.error({ err }, "Can't get server count.")
//         return
//       })

//     msg?.reply({
//       servers: serverResults
//     })
//   }
// })

let clientId: string

async function sendStats() {
  const clustersInfo = (await manager
    .broadcast({ content: { op: 'clustersInfo' }, repliable: true })
    .catch((err) => {
      logger.error({ err }, "Can't get clustersInfo.")
      return
    })) as ClusterInfo[] | undefined

  if (!clustersInfo) return

  const guildCount: number = clustersInfo.reduce((acc, info) => acc + info.guilds, 0)

  await manager
    .broadcast({
      content: { op: 'setPresence', data: `/help | ${(guildCount / 1000).toFixed(1)}k серверов` }
    })
    .catch((err) => {
      logger.error({ err }, "Can't set presence.")
    })

  const lavalinkInfo = (await manager
    .send(0, { content: { op: 'getLavalinkNodes' }, repliable: true })
    .catch((err) => {
      logger.error({ err }, "Can't get lavalink nodes with api.")
      return { success: false, error: err.message }
    })) as NodeInfo[] | undefined

  if (!lavalinkInfo) return

  Influx?.writePoints([
    ...lavalinkInfo.map((el) =>
      new Point('lavalink')
        .timestamp(new Date())
        .tag('name', el.name)
        .intField('penalties', el.penalties)
        .intField('players', el.stats?.players)
        .intField('playingPlayers', el.stats?.playingPlayers)
    ),
    ...clustersInfo.map((el) =>
      new Point('clusters')
        .timestamp(new Date())
        .tag('id', el.id)
        .intField('guilds', el.guilds)
        .floatField('ping', el.ping)
    ),
    new Point('bot')
      .timestamp(new Date())
      .intField('guilds', guildCount)
      .intField('shards', manager.shardCount)
      .intField('clusters', manager.clusterCount)
  ])

  try {
    const res = await fetch('https://vk-api-v2.megaworld.space/metrics', {
      method: 'POST',
      body: JSON.stringify({
        token: process.env.API_TOKEN,
        metrics: {
          servers: guildCount,
          serverShards: clustersInfo.map((el) => el.guilds)
          //lavalinkInfo
        }
      })
    })
    const data = (await res.json()) as any
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
    clientId = (await manager
      ?.send(0, { content: { op: 'clientId' }, repliable: true })
      .catch((err) => {
        logger.error({ err }, "Can't get client id.")
        return
      })) as string

  // SDC
  try {
    const res = await fetch(`https://api.server-discord.com/v2/bots/${clientId}/stats`, {
      method: 'POST',
      body: JSON.stringify({
        servers: guildCount,
        shards: manager.shardCount
      }),
      headers: {
        'Content-Type': 'application/json',
        Authorization: 'SDC ' + process.env.SDC_TOKEN
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

  // Boticord
  try {
    const res = await fetch(`https://api.boticord.top/v3/bots/${clientId}/stats`, {
      method: 'POST',
      body: JSON.stringify({
        servers: guildCount,
        shards: manager.shardCount
      }),
      headers: {
        'Content-Type': 'application/json',
        Authorization: process.env.BOTICORD_TOKEN
      }
    })
    const data = (await res.json()) as any
    if (!res.ok) {
      logger.error(`Send stats error (http error). ${res.status}`)
      return
    }
    if (data.error) {
      logger.error({ err: data.error }, 'Error sending stats (server error)')
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
    await startApiServer()
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

// async function exit() {
//   logger.info('exit')
//   process.exit()
// }

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
