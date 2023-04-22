import fastify from 'fastify'
import logger from '../../logger.js'
import { Type } from '@sinclair/typebox'
import { manager } from '../manager.js'
import {
  NodeDelete,
  NodeDeleteType,
  NodeOptionRequest,
  NodeOptionRequestType,
  PlayersOptions,
  PlayersOptionsType
} from './schemas.js'

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

server.get('/api/lavalink-nodes', async () => {
  const list: any[] = await manager.ipc
    ?.send(0, { content: { op: 'getLavalinkNodes' }, repliable: true })
    .catch((err) => {
      logger.error({ err }, "Can't get lavalink nodes with api.")
      return { success: false, error: err.message }
    })

  return {
    success: true,
    list
  }
})

server.post<{ Body: NodeOptionRequestType }>(
  '/api/lavalink-nodes',
  { schema: { body: Type.Strict(NodeOptionRequest) } },
  async (req) => {
    await manager.ipc?.broadcast({ content: { op: 'addLavalinkNode', node: req.body } }).catch((err) => {
      logger.error({ err }, "Can't add node with api.")
      return { success: false, error: err.message }
    })

    return { success: true }
  }
)

server.delete<{ Params: NodeDeleteType }>(
  '/api/lavalink-nodes/:name',
  { schema: { params: Type.Strict(NodeDelete) } },
  async (req) => {
    const reply: boolean[] = (await manager.ipc
      ?.broadcast({ content: { op: 'removeLavalinkNode', nodeName: req.params.name }, repliable: true })
      .catch((err) => {
        logger.error({ err }, "Can't remove node with api.")
        return { success: false, error: err.message }
      })) as boolean[]
    return { success: reply[0] }
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
