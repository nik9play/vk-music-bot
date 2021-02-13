export default {
  name: "donate",
  aliases: ["premium", "d"],
  adminOnly: true,
  execute: async (message) => {
    const premium = await message.client.configDB.checkPremium(message.guild.id)

    const info = 
`${premium ? "**Спасибо за поддержку бота!**\n" : ""}
Вы можете приобрести **Премиум**, задонатив 15₽ или больше [здесь](https://vk.com/app6887721_-197274096)
**В комментарий к переводу укажите данный ID**: \`${message.guild.id}\`
Премиум дает Вам следующие возможности:
● Режим 24/7
● Ограничение очереди в 20к, а не в 200
● Перемешивание очереди
● Настройка эквалайзера
Все деньги идут на развитие и поддержание бота. Вы можете пользоваться всеми остальными функциями бота абсолютно бесплатно.`

      const embed = {
        color: 0x5181b8,
        title: `Статус **Премиума**:  ${premium ? "<:yes:806179743766413323>" : "<:no:806178831994978385>"}`,
        description: info
      }

      message.channel.send({embed})
  }
}