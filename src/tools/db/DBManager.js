import { MongoClient } from 'mongodb'
import redis from 'redis'
import { promisify } from 'util'

export default class db {
  /**
   * @param {string} databaseURL MongoDB URL
   * @param {string} redisURL Redis URL
   */
  constructor (databaseURL, redisURL) {
    this.url = databaseURL
    this.redisURL = redisURL
  }

  /**
   * Подключение к MongoDB
   */
  async init() {
    this.client = new MongoClient(this.url, { useUnifiedTopology: true })
    await this.client.connect()

    this.redis = redis.createClient({ url: this.redisURL })
    this.redisGet = promisify(this.redis.get).bind(this.redis)
    this.redisSet = promisify(this.redis.set).bind(this.redis)

    this.database = this.client.db('vkmusicbot_db')
    this.collection = this.database.collection('serverconfig')
  }

  isConnected() {
    return this.client.isConnected()
  }

  /**
   * Закрыть подключение к MongoDB
   */
  async close() {
    await this.client.close()
  }

  async setValueUpsert(guild_id, property, value) {
    const query = { guild_id }
    const update = {$set: {}}
    update.$set[property] = value

    this.redisSet(`${guild_id}/${property}`, JSON.stringify({ value }), 'EX', 86400) // удалить ключ через сутки
    await this.collection.updateOne(query, update, {upsert: true})
  }

  async getValue(guild_id, property, defaultValue) {
    const query = { guild_id }
    query[property] = { $exists: true }

    // чтение из кеша
    const redisValue = await this.redisGet(`${guild_id}/${property}`)
    if (redisValue) {
      const redisObj = JSON.parse(redisValue)
      return redisObj.value
    }

    const server = await this.collection.findOne(query)

    if (!server) {
      this.redisSet(`${guild_id}/${property}`, JSON.stringify({ value: defaultValue }), 'EX', 86400)
      return defaultValue
    }
    else {
      this.redisSet(`${guild_id}/${property}`, JSON.stringify({ value: server[property] }), 'EX', 86400)
      return server[property]
    }
  }

  // /**
  //  * Получить дефолтный конфиг для сервера
  //  */
  // getDefaultConfig(id) {
  //   return {
  //     guild_id: id,
  //     prefix: "-v",
  //     premium: false,
  //     perms: {
  //       allow: {
  //         ADD_TO_QUEUE: [],
  //         MANAGE_QUEUE: [],
  //         VIEW_QUEUE: [],
  //         MANAGE_PLAYER: []
  //       },
  //       deny: {
  //         ADD_TO_QUEUE: [],
  //         MANAGE_QUEUE: [],
  //         VIEW_QUEUE: [],
  //         MANAGE_PLAYER: []
  //       }
  //     }
  //   }
  // }

  // /**
  //  * Получить конфиг для сервера
  //  * @param generate Создать запись в базе, если ее нет
  //  */
  // async getConfig(generate, id) {
  //   const query = { guild_id: id }
  //   let server = await this.collection.findOne(query)

  //   if (!server) {
  //     if (generate)
  //       await this.generateConfig(id)
      
  //     server = this.getDefaultConfig(id)
  //   }

  //   return server
  // }

  // async generateConfig(id) {
  //   const config = this.getDefaultConfig(id)

  //   await this.collection.insertOne(config)
  // }

  // reverseAction(action) {
  //   return action == "allow" ? "deny" : "allow"
  // }

  // async setPerm(id, perm, action, guild_id) {
  //   // await this.getConfig(true)
  //   const query = { guild_id: guild_id }
    
  //   if (perm == "ALL") {
  //     if (action == "reset")
  //       return await this.collection.updateOne(query, {
  //         $pull: {
  //           [`perms.${action}.ADD_TO_QUEUE`]: id,
  //           [`perms.${action}.MANAGE_QUEUE`]: id,
  //           [`perms.${action}.VIEW_QUEUE`]: id,
  //           [`perms.${action}.MANAGE_PLAYER`]: id,
  //           [`perms.${this.reverseAction(action)}.ADD_TO_QUEUE`]: id,
  //           [`perms.${this.reverseAction(action)}.MANAGE_QUEUE`]: id,
  //           [`perms.${this.reverseAction(action)}.VIEW_QUEUE`]: id,
  //           [`perms.${this.reverseAction(action)}.MANAGE_PLAYER`]: id
  //         }
  //       }, {upsert: true})
      
  //     return await this.collection.updateOne(query, {
  //       $addToSet: {
  //         [`perms.${action}.ADD_TO_QUEUE`]: id,
  //         [`perms.${action}.MANAGE_QUEUE`]: id,
  //         [`perms.${action}.VIEW_QUEUE`]: id,
  //         [`perms.${action}.MANAGE_PLAYER`]: id
  //       },
  //       $pull: {
  //         [`perms.${this.reverseAction(action)}.ADD_TO_QUEUE`]: id,
  //         [`perms.${this.reverseAction(action)}.MANAGE_QUEUE`]: id,
  //         [`perms.${this.reverseAction(action)}.VIEW_QUEUE`]: id,
  //         [`perms.${this.reverseAction(action)}.MANAGE_PLAYER`]: id
  //       }
  //     }, {upsert: true})
  //   } else {
  //     if (action == "reset")
  //       return await this.collection.updateOne(query, {
  //         $pull: {
  //           [`perms.${action}.${perm}`]: id,
  //           [`perms.${this.reverseAction(action)}.${perm}`]: id
  //         }
  //       }, {upsert: true})

  //     return await this.collection.updateOne(query, {
  //       $addToSet: {
  //         [`perms.${action}.${perm}`]: id
  //       },
  //       $pull: {
  //         [`perms.${this.reverseAction(action)}.${perm}`]: id
  //       }
  //     }, {upsert: true})
  //   }
  // }

  // async checkPerm(id, perm, guild_id) {
  //   const query = {
  //     guild_id: guild_id,
  //     $or: [
  //       {
  //         [`perms.allow.${perm}`]: { $in: [id] },
  //         [`perms.deny.${perm}`]: { $not: { $in: [id] } }

  //       },
  //       {
  //         [`perms.allow.${perm}`]: { $not: { $in: [id] } },
  //         [`perms.deny.${perm}`]: { $not: { $in: [id] } }
  //       }
  //     ]
  //   }
  //   const server = await this.collection.countDocuments(query)

  //   if (server)
  //     return true
  //   else
  //     return false
  // }

  async setAccessRole(name, guild_id) {
    await this.setValueUpsert(guild_id, 'accessRoleName', name)
  }

  async getAccessRole(guild_id) {
    return await this.getValue(guild_id, 'accessRoleName', 'DJ')
  }

  async setAccessRoleEnabled(enable, guild_id) {
    await this.setValueUpsert(guild_id, 'accessRoleNameEnabled', enable)
  }

  async getAccessRoleEnabled(guild_id) {
    return await this.getValue(guild_id, 'accessRoleNameEnabled', false)
  }

  async setPrefix(prefix, guild_id) {
    await this.setValueUpsert(guild_id, 'prefix', prefix)
  }

  async getPrefix(guild_id) {
    return await this.getValue(guild_id, 'prefix', '-v')
  }

  async set247(enable, guild_id) {
    await this.setValueUpsert(guild_id, 'e247', enable)
  }

  async get247(guild_id) {
    return await this.getValue(guild_id, 'e247', false)
  }

  async setDisableAnnouncements(enable, guild_id) {
    await this.setValueUpsert(guild_id, 'disableAnnouncements', enable)
  }

  async getDisableAnnouncements(guild_id) {
    return await this.getValue(guild_id, 'disableAnnouncements', false)
  }

  async checkPremium(guild_id) {
    return await this.getValue(guild_id, 'premium', false)
  }
}