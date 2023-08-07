import { ActionRowBuilder, ButtonBuilder, ButtonStyle, SlashCommandBuilder } from 'discord.js'
import { getConfig } from '../../db.js'
import { CommandCustomInteraction } from '../commandInteractions.js'
import { Emojis } from '../../utils.js'

export const interaction: CommandCustomInteraction = {
  name: 'donate',
  adminOnly: true,
  data: new SlashCommandBuilder()
    .setName('donate')
    .setDescription('Вывод информации о донате и премиуме')
    .setDMPermission(false),
  execute: async ({ guild, respond }) => {
    const config = await getConfig(guild.id)

    const { premium } = config

    let info = `${premium ? '**Спасибо за поддержку бота!**\n' : ''}`

    if (!premium)
      info += `Вы можете приобрести **Премиум**, задонатив 45₽ или больше [здесь](https://vk.com/app6887721_-197274096)
**В комментарий к переводу укажите данный ID**: \`${guild.id}\`
Премиум дает Вам следующие возможности:
● Режим 24/7 
● Ограничение очереди в 20к, а не в 200 
● Перемешивание очереди
● Бас буст 
● Автоматический пропуск капчи
Все деньги идут на развитие и поддержание бота. Вы можете пользоваться всеми остальными функциями бота абсолютно бесплатно.`
    else
      info +=
        'Если вы хотите задонатить на развитие бота, нажмите [сюда](https://vk.com/app6887721_-197274096)'

    const embed = {
      color: 0x0ea5e9,
      title: `Статус **Премиума**:  ${premium ? Emojis.Yes : Emojis.No}`,
      description: info
    }

    if (!premium) {
      const row = new ActionRowBuilder<ButtonBuilder>().addComponents(
        new ButtonBuilder()
          .setLabel('Приобрести Премиум')
          .setStyle(ButtonStyle.Link)
          .setURL('https://vk.com/app6887721_-197274096')
      )

      await respond({ embeds: [embed], components: [row] })
      return
    }

    await respond({ embeds: [embed] })
  }
}
