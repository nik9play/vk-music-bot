import redis from 'redis'
const redisClient = redis.createClient({url: process.env.REDIS_URL})

redisClient.on("error", function(error) {
  console.error(error)
})

export default function(message, callback) {
  redisClient.sismember("premium-server-list", message.guild.id.toString(), (err, reply) => {
    if (err)
      console.error(err)

    if (reply == 0)
      return message.reply("Ваш сервер не имеет **Премиума**. Подробности: `-vdonate`")
    else
      return callback()
  })
}