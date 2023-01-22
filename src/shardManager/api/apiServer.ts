import fastify from 'fastify'
import { Client } from 'discord.js'
import { VkMusicBotClient } from '../../client.js'
import logger from '../../logger.js'
import { ReclusterOptions, ReclusterOptionsType } from './schemas.js'
import { Type } from '@sinclair/typebox'

const server = fastify()

// server.get<{ Params: ReclusterOptionsType }>(
//   '/api/recluster/:mode',
//   {
//     schema: {
//       params: Type.Strict(ReclusterOptions)
//     }
//   },
//   async (req) => {
//     manager.recluster?.start({ restartMode: req.params.mode })

//     return { success: true }
//   }
// )

// server.get('/api/players/:action', async (req) => {
//   function clearQueues(c: Client) {
//     const botClient = c as VkMusicBotClient
//     for (const player of botClient.kagazumo.players.values()) {
//       player.destroy()
//       //player.queue.clear()
//     }
//   }

//   await manager.broadcastEval(clearQueues)

//   return { success: true }
// })

const port = parseInt(process.env.API_PORT ?? '4000')

function startApiServer() {
  server.listen({ port }, (err, address) => {
    if (err) {
      logger.error(err)
    }
    logger.info(`API listening at ${address}`)
  })
}

export { startApiServer }
