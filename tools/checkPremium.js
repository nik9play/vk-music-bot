import redis from 'redis'
const redisClient = redis.createClient({url: process.env.REDIS_URL})

redisClient.on("error", function(error) {
  console.error(error)
})

export default async function(message, replyMessage = "ваш сервер не имеет **Премиума**. Подробности: `-vdonate`") {
  return new Promise((resolve) => {
    return redisClient.sismember("premium-server-list", message.guild.id.toString(), (err, reply) => {
      if (err)
      console.error(err)

      if (reply == 0) {
        message.reply(replyMessage)
        resolve(false)
      } else {
        resolve(true)
      }
    })
  })
}