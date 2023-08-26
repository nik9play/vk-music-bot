import { Hono } from 'hono'
import { zValidator } from '@hono/zod-validator'

import logger from '../../logger.js'
import { manager } from '../manager.js'
import { connectDb, getConfig, updateConfig } from '../../db.js'
import { ENV } from '../../modules/env.js'
import { z } from 'zod'
import { serve } from '@hono/node-server'

const app = new Hono()

app.get('/api/recluster', async (c) => {
  await manager.restartAll().catch((err) => {
    logger.error({ err }, "Can't restart clusters with api.")
    return c.json({ success: false, error: err.message })
  })

  return c.json({ success: true })
})

app.get('/api/players/clear-queues', async (c) => {
  await manager.broadcast({ content: { op: 'clearQueues' } }).catch((err) => {
    logger.error({ err }, "Can't clear queues with api.")
    return c.json({ success: false, error: err.message })
  })

  return c.json({ success: true })
})

app.get('/api/players/destroy-all', async (c) => {
  await manager.broadcast({ content: { op: 'destroyAll' } }).catch((err) => {
    logger.error({ err }, "Can't destroy players with api.")
    return c.json({ success: false, error: err.message })
  })

  return c.json({ success: true })
})

app.get('/api/lavalink-nodes', async (c) => {
  const list = await manager
    .send(0, { content: { op: 'getLavalinkNodes' }, repliable: true })
    .catch((err: any) => {
      logger.error({ err }, "Can't get lavalink nodes with api.")
      return c.json({ success: false, error: err.message })
    })

  return c.json(list)
})

app.post(
  '/api/lavalink-nodes',
  zValidator(
    'json',
    z.object({
      name: z.string(),
      urL: z.string(),
      auth: z.string(),
      secure: z.boolean().optional().default(false),
      group: z.boolean().optional().default(false)
    })
  ),
  async (c) => {
    const nodeOptions = c.req.valid('json')

    await manager
      .broadcast({ content: { op: 'addLavalinkNode', data: nodeOptions } })
      .catch((err) => {
        logger.error({ err }, "Can't add node with api.")
        return c.json({ success: false, error: err.message })
      })

    return c.json({ success: true })
  }
)

app.delete(
  '/api/lavalink-nodes/:name',
  zValidator(
    'param',
    z.object({
      name: z.string()
    })
  ),
  async (c) => {
    const params = c.req.valid('param')

    const reply: boolean[] = (await manager
      .broadcast({ content: { op: 'removeLavalinkNode', data: params.name }, repliable: true })
      .catch((err) => {
        logger.error({ err }, "Can't remove node with api.")
        return c.json({ success: false, error: err.message })
      })) as boolean[]

    return c.json({ success: reply[0] })
  }
)

app.get(
  '/api/config/:guildId',
  zValidator(
    'param',
    z.object({
      guildId: z.string()
    })
  ),
  async (c) => {
    const params = c.req.valid('param')

    return c.json(await getConfig(params.guildId))
  }
)

await connectDb()

app.post(
  '/api/config/:guildId',
  zValidator(
    'param',
    z.object({
      guildId: z.string()
    })
  ),
  zValidator(
    'json',
    z.object({
      premium: z.boolean().optional()
    })
  ),
  async (c) => {
    const params = c.req.valid('param')
    const json = c.req.valid('json')

    return c.json(await updateConfig(params.guildId, json))
  }
)

const port = ENV.PORT

async function startApiServer() {
  serve({
    fetch: app.fetch,
    port
  })
  logger.info('Started api server.')
}

export { startApiServer, app }
