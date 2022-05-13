import { Command } from '../SlashCommandManager'

export default new Command({
  name: 'donate',
  aliases: ['premium', 'd'],
  adminOnly: true,
  premium: false,
  djOnly: false,
  execute: async ({ client, guild, respond }) => {
    const premium = await client.db.checkPremium(guild.id)

    let info =
      `${premium ? '**Спасибо за поддержку бота!**\n' : ''}`

    if (!premium) info +=
      `Вы можете приобрести **Премиум**, задонатив 15₽ или больше [здесь](https://vk.com/app6887721_-197274096)
**В комментарий к переводу укажите данный ID**: \`${guild.id}\`
Премиум дает Вам следующие возможности:
● Режим 24/7
● Ограничение очереди в 20к, а не в 200
● Перемешивание очереди
● Бас-буст
Все деньги идут на развитие и поддержание бота. Вы можете пользоваться всеми остальными функциями бота абсолютно бесплатно.`
    else info += 'Если вы хотите задонатить на развитие бота, нажмите [сюда](https://vk.com/app6887721_-197274096)'

    const embed = {
      color: 0x5181b8,
      title: `Статус **Премиума**:  ${premium ? '<:yes2:835498559805063169>' : '<:no2:835498572916195368>'}`,
      description: info
    }

    await respond({ embeds: [embed] })
  }
})
