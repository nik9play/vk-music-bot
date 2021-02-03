import { MongoClient } from 'mongodb'

export default async function(id) {
  const client = new MongoClient(process.env.MONGO_URL, { useUnifiedTopology: true })

  try {
    await client.connect()

    const database = client.db('vkmusicbot')
    const collection = database.collection('serverconfig')

    const query = { guild_id: id }
    const server = await collection.findOne(query)

    //if 

    return server
  } finally {
    await client.close()
  }
}