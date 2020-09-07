import redis from 'redis'
const redisClient = redis.createClient({url: process.env.REDIS_URL})

redisClient.on("error", function(error) {
  console.error(error);
})

export default {
  name: "vdonate",
  description: "Информация о донатах и Премиум статусе сервера.",
  cooldown: 1,
  execute: async function(message) {
    redisClient.sismember("premium-server-list", message.guild.id.toString(), (err, reply) => {
      const info = 
`${reply ? "**Спасибо за поддержку бота!**\n" : ""}
Вы можете приобрести **Премиум**, задонатив 15₽ или больше [здесь](https://vk.com/app6887721_-197274096)
**В комментарий к переводу укажите данный ID**: \`${message.guild.id}\`.

Премиум дает Вам следующие возможности:
● Режим 24/7
● Ограничение очереди в 20к, а не в 200
● Перемешивание очереди

Все деньги идут на развитие и поддержание бота. Вы можете пользоваться всеми остальными функциями бота абсолютно бесплатно.`

      const embed = {
        color: 0x5181b8,
        title: `Статус **Премиума**:  ${reply ? ":white_check_mark:" : ":x:"}`,
        description: info
      }

      message.channel.send({embed})
    })
  }
}