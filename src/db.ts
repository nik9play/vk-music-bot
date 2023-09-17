//import { PrismaClient, ServerConfig } from '@prisma/client'
import Redis from 'ioredis'
import mongoose, { Schema, model, connect, InferSchemaType } from 'mongoose'
import logger from './logger.js'
import { ENV } from './modules/env.js'

export const redis = new Redis(ENV.REDIS_URL, { lazyConnect: true })

const serverConfigSchema = new Schema(
  {
    guildId: { type: String, required: true, index: true },
    premium: Boolean,
    volume: Number,
    defaultSource: String,
    announcements: Boolean,
    djMode: Boolean,
    djRoleName: String,
    prefix: String,
    enable247: Boolean
  },
  { versionKey: false }
)

type ServerConfig = InferSchemaType<typeof serverConfigSchema>

export const ServerConfigModel = model<ServerConfig>('ServerConfig', serverConfigSchema)

export async function connectDb() {
  mongoose.set('strictQuery', false)
  await connect(ENV.MONGO_URL)
}

redis.on('connect', () => {
  logger.info('Redis connected.')
})

export type ServerConfigStrong = Required<ServerConfig>

const defaultConfig = {
  premium: false,
  volume: 100,
  defaultSource: 'vk',
  announcements: true,
  djMode: false,
  djRoleName: 'DJ',
  prefix: '-v',
  enable247: false
} as const satisfies Omit<ServerConfig, 'guildId'>

export async function getConfig(guildId: string): Promise<ServerConfigStrong> {
  let config: ServerConfig | null = null

  const configCache = await redis.get(`config/${guildId}`)

  if (configCache) {
    try {
      config = JSON.parse(configCache)
      logger.debug({ guild_id: guildId }, 'Config cache get')
    } catch {
      await redis.del(`config/${guildId}`)

      const document = await ServerConfigModel.findOne({ guildId })
      if (document) config = document.toJSON<ServerConfig>()

      logger.debug({ guild_id: guildId }, 'Config mongo get')
    }
  } else {
    const document = await ServerConfigModel.findOne({ guildId })
    if (document) config = document.toJSON<ServerConfig>()
    logger.debug({ guild_id: guildId }, 'Config mongo get')

    await redis.set(`config/${guildId}`, JSON.stringify(config), 'EX', 24 * 60 * 60)
  }

  return {
    guildId,
    ...defaultConfig,
    ...config
  } as const
}

export async function updateConfig(
  guildId: string,
  data: Partial<ServerConfig>
): Promise<ServerConfigStrong> {
  const config = await ServerConfigModel.findOneAndUpdate(
    { guildId },
    { $set: data },
    { upsert: true, new: true }
  )

  await redis.set(`config/${guildId}`, JSON.stringify(config), 'EX', 24 * 60 * 60)

  return {
    ...defaultConfig,
    ...config.toJSON<ServerConfig>()
  } as const
}
