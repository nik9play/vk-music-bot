import { Schema, model, connect } from 'mongoose'

const serverConfigSchema = new Schema({
  guildId: { type: String, required: true },
  premium: Boolean,
  announcements: Boolean,
  djMode: Boolean,
  djRoleName: String,
  djRoleId: String,
  prefix: String,
  enable247: Boolean,
  menuMessageId: String
})
const ServerConfig = model('ServerConfig', serverConfigSchema)

await connect(process.env.MONGO_URL)

console.log(await ServerConfig.findOne({ guildId: 123 }))
