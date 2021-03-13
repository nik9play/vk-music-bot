import mongoose from 'mongoose'

// const ServerConfig = new mongoose.Schema({
//   guild_id: {type: String, required: true, index: true},
//   prefix: String,
//   premium: Boolean,
//   perms: {
//     allow: {
//       ADD_TO_QUEUE: Array,
//       MANAGE_QUEUE: Array,
//       VIEW_QUEUE: Array,
//       MANAGE_PLAYER: Array
//     },
//     deny: {
//       ADD_TO_QUEUE: Array,
//       MANAGE_QUEUE: Array,
//       VIEW_QUEUE: Array,
//       MANAGE_PLAYER: Array
//     }
//   }
// })

export default class dbConfig {
  /**
   * @param {string} databaseURL MongoDB URL
   * @param {string} id Guild ID
   */
  constructor (databaseURL, id) {
    this.url = databaseURL
    this.id = id
  }

  /**
 * Подключение к MongoDB
 */
  async init() {
    await mongoose.connect(process.env.MONGO_URL, {useNewUrlParser: true})
  }

  /**
   * Закрыть подключение к MongoDB
   */
  async close() {
    await this.client.close()
  }
}