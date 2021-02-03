import { MongoClient } from 'mongodb'

export default async function(id, opts) {
  const client = new MongoClient(process.env.MONGO_URL, { useUnifiedTopology: true })

  try {
    await client.connect()

    const database = client.db('vkmusicbot')
    const collection = database.collection('serverconfig')

    const query = { guild_id: id }
    const server = await collection.findOneAndUpdate(query, opts)

    if (!server) {
      const optsNew = {
        guild_id: id,
        prefix: "-v",
        premium: false,
        perms: {
          ADD_TO_QUEUE: [],
          MANAGE_QUEUE: [],
          VIEW_QUEUE: [],
          MANAGE_PLAYER: []
        }
      }

      await collection.insertOne({...optsNew, ...opts})
    }
  } finally {
    await client.close()
  }
}