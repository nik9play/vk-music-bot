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
import { ENV } from '../modules/env.js'

const options: IndomitableOptions = {
  // Processes to run
  clusterCount: ENV.VK_TOTAL_SHARDS / ENV.SHARDS_PER_CLUSTER,
  // Websocket shards to run
  shardCount: ENV.VK_TOTAL_SHARDS,
  // Discord.JS options
  clientOptions: {
    allowedMentions: { parse: ['roles', 'users'] },
    makeCache: Options.cacheWithLimits({
      ...Options.DefaultMakeCacheSettings,
      MessageManager: 0,
      PresenceManager: 0,
      GuildStickerManager: 0,
      GuildBanManager: 0,
      GuildInviteManager: 0,
      GuildEmojiManager: 0,
      ReactionManager: 0,
      GuildScheduledEventManager: 0,
      AutoModerationRuleManager: 0,
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
      api: ENV.DISCORD_PROXY_URL,
      timeout: 30_000
    }
  },
  autoRestart: true,
  spawnTimeout: 120_000,
  client: VkMusicBotClient as any,

  // will not work correctly without max_concurrency
  handleConcurrency: ENV.NODE_ENV === 'production',
  waitForReady: ENV.NODE_ENV !== 'production',

  token: ENV.DISCORD_TOKEN
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

let lastClustersInfo: ClusterInfo[] | undefined
let lastLavalinkInfo: NodeInfo[] | undefined

async function sendBotStatistics() {
  if (!clientId)
    clientId = (await manager
      ?.send(0, { content: { op: 'clientId' }, repliable: true })
      .catch((err) => {
        logger.error({ err }, "Can't get client id.")
        return
      })) as string

  lastClustersInfo = (await manager
    .broadcast({ content: { op: 'clustersInfo' }, repliable: true })
    .catch((err) => {
      logger.error({ err }, "Can't get clustersInfo.")
      return
    })) as ClusterInfo[] | undefined

  if (!lastClustersInfo) return

  const guildCount = lastClustersInfo.reduce((acc, info) => acc + info.guilds, 0)
  const textCount = lastClustersInfo.reduce((acc, info) => acc + info.text, 0)
  const voiceCount = lastClustersInfo.reduce((acc, info) => acc + info.voice, 0)
  const memberCount = lastClustersInfo.reduce((acc, info) => acc + info.members, 0)
  const botMemory = lastClustersInfo.reduce((acc, info) => acc + info.memory, 0)

  // await manager
  //   .broadcast({
  //     content: { op: 'setPresence', data: `/help | ${(guildCount / 1000).toFixed(1)}k серверов` }
  //   })
  //   .catch((err) => {
  //     logger.error({ err }, "Can't set presence.")
  //   })

  lastLavalinkInfo = (await manager
    .send(0, { content: { op: 'getLavalinkNodes' }, repliable: true })
    .catch((err) => {
      logger.error({ err }, "Can't get lavalink nodes from IPC.")
      return
    })) as NodeInfo[] | undefined

  if (!lastLavalinkInfo) return

  const points = [
    ...lastClustersInfo.map((el) =>
      new Point('clusters')
        // .timestamp(new Date())
        .tag('id', el.id)
        .intField('guilds', el.guilds)
        .intField('text', el.text)
        .intField('voice', el.voice)
        .intField('members', el.members)
        .intField('memory', el.memory)
        .floatField('ping', el.ping)
    ),
    new Point('bot')
      // .timestamp(new Date())
      .intField('guilds', guildCount)
      .intField('text', textCount)
      .intField('voice', voiceCount)
      .intField('members', memberCount)
      .intField('memory', botMemory)
      .intField('shards', manager.shardCount)
      .intField('clusters', manager.clusterCount)
  ]

  for (const lavalinkNode of lastLavalinkInfo) {
    if (lavalinkNode.stats)
      points.push(
        new Point('lavalink')
          // .timestamp(new Date())
          .tag('name', lavalinkNode.name)
          .intField('penalties', lavalinkNode.penalties)
          .intField('players', lavalinkNode.stats?.players)
          .intField('playingPlayers', lavalinkNode.stats?.playingPlayers)
      )
  }

  Influx?.writePoints(points)
}

async function sendBotStatisticsBotList() {
  if (!lastClustersInfo) return

  const guildCount = lastClustersInfo.reduce((acc, info) => acc + info.guilds, 0)

  // SDC
  if (ENV.SDC_TOKEN)
    try {
      const res = await fetch(`https://api.server-discord.com/v2/bots/${clientId}/stats`, {
        method: 'POST',
        body: JSON.stringify({
          servers: guildCount,
          shards: manager.shardCount
        }),
        headers: {
          'Content-Type': 'application/json',
          Authorization: 'SDC ' + ENV.SDC_TOKEN
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
  if (ENV.BOTICORD_TOKEN)
    try {
      const res = await fetch(`https://api.boticord.top/v3/bots/${clientId}/stats`, {
        method: 'POST',
        body: JSON.stringify({
          servers: guildCount,
          shards: manager.shardCount
        }),
        headers: {
          'Content-Type': 'application/json',
          Authorization: ENV.BOTICORD_TOKEN
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
    logger.info('Started spawning clusters.')
    await startApiServer()
  }

  await manager.spawn()

  if (cluster.isPrimary) {
    logger.info('Finished spawning clusters.')

    sendBotStatistics().catch((err) => logger.error({ err }, "Can't send stats at start."))
    sendBotStatisticsBotList().catch((err) =>
      logger.error({ err }, "Can't send stats to bot lists at start.")
    )

    setInterval(
      () =>
        sendBotStatistics().catch((err) => logger.error({ err }, "Can't send stats at interval.")),
      30_000
    )

    setInterval(
      () =>
        sendBotStatisticsBotList().catch((err) =>
          logger.error({ err }, "Can't send stats to bot lists at interval.")
        ),
      30 * 60 * 1000
    )
  }
}

export { startShardManager }
