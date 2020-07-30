import redis from 'redis'
const redisClient = redis.createClient({url: process.env.REDIS_URL})

redisClient.on("error", function(error) {
  console.error(error);
})

export default {
  name: "vdonate",
  description: "Информация о донатах и Премиум статусе сервера.",
  execute: async function(message) {
    redisClient.sismember("premium-server-list", message.guild.id.toString(), (err, reply) => {
      const info = 
`Статус **Премиума**:  ${reply ? ":white_check_mark:" : ":x:"}
${reply ? "**Спасибо за поддержку бота!**\n" : ""}
Вы можете приобрести **Премиум**, задонатив 15₽ или больше по этой ссылке: https://vk.com/vkmusicbotds?w=app6887721_-197274096
**В комментарий к переводу укажите данный ID**: \`${message.guild.id}\`.

Премиум дает Вам следующие возможности:
- Режим 24/7
- Ограничение очереди в 20к, а не в 2к
- Перемешивание очереди

Все деньги идут на развитие и поддержание бота. Вы можете пользоваться всеми остальными функциями бота абсолютно бесплатно.`
      message.channel.send(info)
    })
  }
}