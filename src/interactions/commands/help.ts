import { CommandCustomInteraction } from '../commandInteractions.js'

export const interaction: CommandCustomInteraction = {
  name: 'help',
  cooldown: 1,
  aliases: ['h'],
  adminOnly: false,
  premium: false,
  djOnly: false,
  execute: async function ({ respond }) {
    const embed = {
      title: '❔ Справка',
      color: 0x5181b8,
      fields: [
        {
          name: '⠀',
          value: '**Музыка**'
        },
        {
          name: '</play:906533111796469801>',
          value:
            'Добавить в очереди трек/треки. Принимает название трека, ID трека, ссылку на плейлист или на пользователя. Также добавляет по ID пользователя при помощи префикса `>` (например: `/play запрос:>nikitabogun`)',
          inline: false
        },
        {
          name: '</stop:906533541230297128>',
          value: 'Остановить воспроизведение и очистить очередь',
          inline: true
        },
        {
          name: '</skip:906533293812482118>',
          value: 'Пропуск текущего трека',
          inline: true
        },
        {
          name: '</pause:906533312628142191>',
          value: 'Поставить текущий трек на паузу. Бот выйдет из канала через 20 минут, если не включен режим 24/7',
          inline: true
        },
        {
          name: '</search:906533274355130438>',
          value: 'Поиск по базе ВК. Выводит 5 результатов с выбором',
          inline: true
        },
        {
          name: '</leave:906533561664946196>',
          value: 'Выход из канала',
          inline: true
        },
        {
          name: ':star: </bass:906533740950478908>',
          value: 'Включить бас буст. Доступные уровни: `выкл`, `слабый`, `средний`, `мощный`',
          inline: true
        },

        {
          name: '⠀',
          value: '**Очередь**'
        },
        {
          name: '</queue:906533211868393482>',
          value: 'Просмотр очереди',
          inline: true
        },
        {
          name: ':star: </shuffle:906533332551082015>',
          value: 'Перемешать очередь',
          inline: true
        },
        {
          name: ':star: </247:906533610918666250>',
          value: 'Режим 24/7. Бот не выйдет из канала после окончания очереди, паузы и выхода всех людей из канала',
          inline: true
        },
        {
          name: '</repeat:906533517595389962>',
          value: 'Зацикливание',
          inline: true
        },
        {
          name: '</gachi:906533707651895306>',
          value: 'Случайный гачи-ремикс',
          inline: true
        },
        {
          name: '</mashup:1102512413129064519>',
          value: 'Случайный мэшап',
          inline: true
        },

        {
          name: '⠀',
          value: '**Служебные**'
        },
        {
          name: '</settings show:906547829756002327>',
          value: 'Настройки',
          inline: true
        },
        {
          name: '</donate:906533685979918396>',
          value: 'Информация о Премиуме',
          inline: true
        },
        {
          name: '</info:906533646771564564>',
          value: 'Техническая информация о боте',
          inline: true
        },
        {
          name: '</captcha:906533763033464832>',
          value: 'Ввод капчи',
          inline: true
        },

        {
          name: 'Что-то непонятно?',
          value:
            'Прочитайте [справку о командах](https://vkmusicbot.megaworld.space/commands) или [FAQ](https://vkmusicbot.megaworld.space/faq).'
        }
      ]
    }

    await respond({ embeds: [embed], ephemeral: true })
  }
}
