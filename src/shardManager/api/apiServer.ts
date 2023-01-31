import fastify from 'fastify'
import logger from '../../logger.js'
import { Type } from '@sinclair/typebox'
import { manager } from '../manager.js'
import { PlayersOptions, PlayersOptionsType } from './schemas.js'

const server = fastify()

server.get('/api/recluster', async () => {
  await manager.restartAll().catch((err) => {
    logger.error({ err }, "Can't restart clusters with api.")
    return { success: false, error: err.message }
  })

  return { success: true }
})

server.get<{ Params: PlayersOptionsType }>(
  '/api/players/:action',
  { schema: { params: Type.Strict(PlayersOptions) } },
  async (req) => {
    if (req.params.action === 'clear-queues')
      await manager.ipc?.broadcast({ content: { op: 'clearQueues' } }).catch((err) => {
        logger.error({ err }, "Can't clear queues with api.")
        return { success: false, error: err.message }
      })

    if (req.params.action === 'destroy-all')
      await manager.ipc?.broadcast({ content: { op: 'destroyAll' } }).catch((err) => {
        logger.error({ err }, "Can't destroy players with api.")
        return { success: false, error: err.message }
      })

    return { success: true }
  }
)

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
