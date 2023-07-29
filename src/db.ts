//import { PrismaClient, ServerConfig } from '@prisma/client'
import Redis from 'ioredis'
import mongoose, { Schema, model, connect } from 'mongoose'
import logger from './logger.js'

export const redis = new Redis(process.env.REDIS_URL, { lazyConnect: true })

type ServerConfigSchemaModel = {
  guildId: string
  premium?: boolean
  volume?: number
  defaultSource?: string
  announcements?: boolean
  djMode?: boolean
  djRoleName?: string
  prefix?: string
  enable247?: boolean
}

const serverConfigSchema = new Schema<ServerConfigSchemaModel>(
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

export const ServerConfig = model<ServerConfigSchemaModel>('ServerConfig', serverConfigSchema)

export async function connectDb() {
  mongoose.set('strictQuery', false)
  await connect(process.env.MONGO_URL)
}

redis.on('connect', () => {
  logger.info('Redis connected.')
})

// type ServerConfigNonNull = Ensure<
//   Omit<ServerConfig, 'id'>,
//   'prefix' | 'premium' | 'announcements' | 'djMode' | 'djRoleName'
// >

export type ServerConfigType = Required<ServerConfigSchemaModel>

const defaultConfig = {
  premium: false,
  volume: 100,
  defaultSource: 'vk',
  announcements: true,
  djMode: false,
  djRoleName: 'DJ',
  prefix: '-v',
  enable247: false
}

export async function getConfig(guildId: string): Promise<ServerConfigType> {
  let config: ServerConfigSchemaModel | null = null

  const configCache = await redis.get(`config/${guildId}`)

  if (configCache) {
    try {
      config = JSON.parse(configCache)
      logger.debug({ guildId }, 'Config cache get')
    } catch {
      await redis.del(`config/${guildId}`)

      config = await ServerConfig.findOne<ServerConfigSchemaModel>({ guildId })
      logger.debug({ guildId }, 'Config mongo get')
    }
  } else {
    config = await ServerConfig.findOne<ServerConfigSchemaModel>({ guildId })
    logger.debug({ guildId }, 'Config mongo get')

    await redis.set(`config/${guildId}`, JSON.stringify(config))
  }

  return {
    guildId,
    ...defaultConfig,
    ...config
  }
}

export async function updateConfig(
  guildId: string,
  data: Partial<ServerConfigSchemaModel>
): Promise<ServerConfigType> {
  const config = await ServerConfig.findOneAndUpdate<ServerConfigSchemaModel>(
    { guildId },
    { $set: data },
    { upsert: true, new: true }
  )

  await redis.set(`config/${guildId}`, JSON.stringify(config))

  return {
    ...defaultConfig,
    ...config
  }
}
