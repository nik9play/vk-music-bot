//import { PrismaClient, ServerConfig } from '@prisma/client'
import Redis from 'ioredis'
import mongoose, { Schema, model, connect } from 'mongoose'
import logger from './logger.js'

export const redis = new Redis(process.env.REDIS_URL)

type ServerConfigSchemaModel = {
  guildId: string
  premium?: boolean
  announcements?: boolean
  djMode?: boolean
  djRoleName?: string
  djRoleId?: string
  prefix?: string
  enable247?: boolean
  menuMessageId?: string
}

const serverConfigSchema = new Schema<ServerConfigSchemaModel>(
  {
    guildId: { type: String, required: true, index: true },
    premium: Boolean,
    announcements: Boolean,
    djMode: Boolean,
    djRoleName: String,
    djRoleId: String,
    prefix: String,
    enable247: Boolean,
    menuMessageId: String
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

type ServerConfigType = Required<
  Pick<ServerConfigSchemaModel, 'premium' | 'announcements' | 'djMode' | 'djRoleName' | 'prefix' | 'enable247'>
>

export async function getConfig(guildId: string): Promise<ServerConfigType> {
  let config: ServerConfigSchemaModel | null = null

  const configCache = await redis.get(`config/${guildId}`)

  if (configCache) {
    try {
      config = JSON.parse(configCache)
    } catch {
      await redis.del(`config/${guildId}`)

      config = await ServerConfig.findOne({ guildId })
    }
  } else {
    config = await ServerConfig.findOne({ guildId })

    await redis.set(`config/${guildId}`, JSON.stringify(config))
  }

  return {
    guildId,
    premium: false,
    announcements: true,
    djMode: false,
    djRoleName: 'DJ',
    prefix: '-v',
    enable247: false,
    ...config
  }
}

export async function updateConfig(guildId: string, data: Partial<ServerConfigSchemaModel>): Promise<ServerConfigType> {
  const config = await ServerConfig.findOneAndUpdate({ guildId }, { $set: data }, { upsert: true, new: true })

  await redis.set(`config/${guildId}`, JSON.stringify(config))

  return {
    premium: false,
    announcements: true,
    djMode: false,
    djRoleName: 'DJ',
    prefix: '-v',
    enable247: false,
    ...config
  }
}
