import { Client } from 'discord.js'
import { fetch } from 'undici'
import logger from '../logger.js'
import manager from './manager.js'

function sendInfo() {
  manager
    .fetchClientValues('guilds.cache.size')
    .then(async (results) => {
      const serverSize: number = results.reduce((acc, guildCount) => acc + guildCount, 0)

      function setPr(c: Client, { servers }: any) {
        if (c.user) {
          c.user.setPresence({
            activities: [
              {
                name: `/help | ${(servers / 1000).toFixed(1)}k серверов`,
                type: 2
              }
            ]
          })
        }
      }

      await manager.broadcastEval(setPr, { context: { servers: serverSize } })

      try {
        const res = await fetch('https://vk-api-v2.megaworld.space/metrics', {
          method: 'POST',
          body: JSON.stringify({
            token: process.env.API_TOKEN,
            metrics: {
              servers: serverSize,
              serverShards: results
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

      manager.fetchClientValues('user.id').then(async (results) => {
        const id = results[0]

        try {
          const res = await fetch(`https://api.server-discord.com/v2/bots/${id}/stats`, {
            method: 'POST',
            body: JSON.stringify({
              servers: serverSize,
              shards: manager.totalShards
            }),
            headers: {
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
      })
    })
    .catch((err) => {
      logger.error({ err }, 'Send stat error')
    })
}

export { sendInfo }
