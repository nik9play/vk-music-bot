import { Collection, Db, MongoClient } from 'mongodb'
import { createClient, RedisClientType } from 'redis'
import { Snowflake } from 'discord.js'

export default class BotConfigDb {
  private readonly mongoURL: string
  private readonly redisURL: string
  private mongoClient: MongoClient
  private redisClient: RedisClientType

  private database: Db
  private collection: Collection

  private readonly cacheDuration = 259200

  constructor(mongoURL: string, redisURL: string) {
    this.mongoURL = mongoURL
    this.redisURL = redisURL
    this.mongoClient = new MongoClient(this.mongoURL)
    this.redisClient = createClient({ url: this.redisURL })
    this.database = this.mongoClient.db('vkmusicbot_db')
    this.collection = this.database.collection('serverconfig')
  }

  /**
   * Подключение к MongoDB
   */
  async init() {
    await this.mongoClient.connect()
    await this.redisClient.connect()
  }

  async close() {
    await this.mongoClient.close()
    await this.redisClient.disconnect()
  }

  async setValueUpsert(guild_id: string | Snowflake, property: string, value: any): Promise<void> {
    const query = { guild_id }
    const update = {
      $set: {
        [property]: value
      }
    }

    await this.redisClient.set(`${guild_id}/${property}`, JSON.stringify({ value }), {
      EX: this.cacheDuration // удалить ключ через трое суток
    })
    await this.collection.updateOne(query, update, { upsert: true })
  }

  async getValue(guild_id: string | Snowflake, property: string, defaultValue: any): Promise<any> {
    const query = {
      guild_id,
      [property]: { $exists: true }
    }

    // чтение из кеша
    const redisValue = await this.redisClient.get(`${guild_id}/${property}`)

    if (redisValue) {
      const redisObj = JSON.parse(redisValue)
      return redisObj.value
    }

    const server = await this.collection.findOne(query)

    if (!server) {
      await this.redisClient.set(`${guild_id}/${property}`, JSON.stringify({ value: defaultValue }), {
        EX: this.cacheDuration
      })
      return defaultValue
    } else {
      await this.redisClient.set(`${guild_id}/${property}`, JSON.stringify({ value: server[property] }), {
        EX: this.cacheDuration
      })
      return server[property]
    }
  }

  async setAccessRole(name: string | Snowflake, guild_id: string | Snowflake): Promise<void> {
    await this.setValueUpsert(guild_id, 'accessRoleName', name)
  }

  async getAccessRole(guild_id: string | Snowflake): Promise<string> {
    return await this.getValue(guild_id, 'accessRoleName', 'DJ')
  }

  async setAccessRoleEnabled(enable: boolean, guild_id: string | Snowflake): Promise<void> {
    await this.setValueUpsert(guild_id, 'accessRoleNameEnabled', enable)
  }

  async getAccessRoleEnabled(guild_id: string | Snowflake): Promise<boolean> {
    return await this.getValue(guild_id, 'accessRoleNameEnabled', false)
  }

  async setPrefix(prefix: string, guild_id: string | Snowflake): Promise<void> {
    await this.setValueUpsert(guild_id, 'prefix', prefix)
  }

  async getPrefix(guild_id: string | Snowflake): Promise<string> {
    return await this.getValue(guild_id, 'prefix', '-v')
  }

  async set247(enable: boolean, guild_id: string | Snowflake): Promise<void> {
    await this.setValueUpsert(guild_id, 'e247', enable)
  }

  async get247(guild_id: string | Snowflake): Promise<boolean> {
    return await this.getValue(guild_id, 'e247', false)
  }

  async setDisableAnnouncements(enable: boolean, guild_id: string | Snowflake): Promise<void> {
    await this.setValueUpsert(guild_id, 'disableAnnouncements', enable)
  }

  async getDisableAnnouncements(guild_id: string | Snowflake): Promise<boolean> {
    return await this.getValue(guild_id, 'disableAnnouncements', false)
  }

  async checkPremium(guild_id: string | Snowflake): Promise<boolean> {
    return await this.getValue(guild_id, 'premium', false)
  }
}
