import { MongoClient } from 'mongodb'

export default class ConfigDB {
  /**
   * @param {string} databaseURL MongoDB URL
   */
  constructor (databaseURL) {
    this.url = databaseURL
  }

  /**
   * Подключение к MongoDB
   */
  async init() {
    this.client = new MongoClient(this.url, { useUnifiedTopology: true })
    await this.client.connect()

    this.database = this.client.db('vkmusicbot')
    this.collection = this.database.collection('serverconfig')
  }

  isConnected() {
    return this.client.isConnected
  }

  /**
   * Закрыть подключение к MongoDB
   */
  async close() {
    await this.client.close()
  }

  /**
   * Получить дефолтный конфиг для сервера
   */
  getDefaultConfig(id) {
    return {
      guild_id: id,
      prefix: "-v",
      premium: false,
      perms: {
        allow: {
          ADD_TO_QUEUE: [],
          MANAGE_QUEUE: [],
          VIEW_QUEUE: [],
          MANAGE_PLAYER: []
        },
        deny: {
          ADD_TO_QUEUE: [],
          MANAGE_QUEUE: [],
          VIEW_QUEUE: [],
          MANAGE_PLAYER: []
        }
      }
    }
  }

  /**
   * Получить конфиг для сервера
   * @param generate Создать запись в базе, если ее нет
   */
  async getConfig(generate, id) {
    const query = { guild_id: id }
    let server = await this.collection.findOne(query)

    if (!server) {
      if (generate)
        await this.generateConfig(id)
      
      server = this.getDefaultConfig(id)
    }

    return server
  }

  async generateConfig(id) {
    const config = this.getDefaultConfig(id)

    await this.collection.insertOne(config)
  }

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
    const query = { guild_id: guild_id }

    await this.collection.updateOne(query, {
      $set: {
        accessRoleName: name
      }
    }, {upsert: true})
  }

  async getAccessRole(guild_id) {
    const query = { guild_id: guild_id, accessRoleName: { $exists: true } }

    const server = await this.collection.findOne(query)

    if (!server)
      return "DJ"
    else
      return server.accessRoleName
  }

  async setAccessRoleEnabled(enable, guild_id) {
    const query = { guild_id: guild_id }

    await this.collection.updateOne(query, {
      $set: {
        accessRoleNameEnabled: enable
      }
    }, {upsert: true})
  }

  async getAccessRoleEnabled(guild_id) {
    const query = { guild_id: guild_id, accessRoleNameEnabled: { $exists:true } }

    const server = await this.collection.findOne(query)

    if (!server)
      return false
    else
      return server.accessRoleNameEnabled
  }


  async setPrefix(prefix, guild_id) {
    const query = { guild_id: guild_id }

    await this.collection.updateOne(query, {
      $set: {
        "prefix": prefix
      }
    }, {upsert: true})
  }

  async getPrefix(guild_id) {
    const query = { guild_id: guild_id, prefix: { $exists: true } }

    const server = await this.collection.findOne(query)

    if (!server)
      return "-v"
    else
      return server.prefix
  }

  async checkPremium(guild_id) {
    const query = { guild_id: guild_id, premium: true }

    const server = await this.collection.countDocuments(query)

    if (server)
      return true
    else
      return false
  }
}