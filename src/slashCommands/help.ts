import { Command } from '../modules/slashCommandManager.js'

export default new Command({
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
          name: '`/play`',
          value:
            'Добавить в очереди трек/треки. Принимает название трека, ID трека, ссылку на плейлист или на пользователя. Также добавляет по ID пользователя при помощи префикса `>` (например: `/p >nikitabogun`)',
          inline: false
        },
        {
          name: '`/stop`',
          value: 'Остановить воспроизведение и очистить очередь',
          inline: true
        },
        {
          name: '`/skip`',
          value: 'Пропуск текущего трека',
          inline: true
        },
        {
          name: '`/pause`',
          value: 'Поставить текущий трек на паузу. Бот выйдет из канала через 20 минут, если не включен режим 24/7',
          inline: true
        },
        {
          name: '`/search`',
          value: 'Поиск по базе ВК. Выводит 5 результатов с выбором',
          inline: true
        },
        {
          name: '`/leave`',
          value: 'Выход из канала',
          inline: true
        },
        {
          name: ':star: `/bass`',
          value: 'Включить бас буст. Доступные уровни: `выкл`, `слабый`, `средний`, `мощный`',
          inline: true
        },

        {
          name: '⠀',
          value: '**Очередь**'
        },
        {
          name: '`/queue`',
          value: 'Просмотр очереди',
          inline: true
        },
        {
          name: ':star: `/shuffle`',
          value: 'Перемешать очередь',
          inline: true
        },
        {
          name: ':star: `/247`',
          value: 'Режим 24/7. Бот не выйдет из канала после окончания очереди, паузы и выхода всех людей из канала',
          inline: true
        },
        {
          name: '`/repeat`',
          value: 'Зацикливание',
          inline: true
        },
        {
          name: '`/gachi`',
          value: 'Случайный гачи-ремикс',
          inline: true
        },
        {
          name: '`/mashup`',
          value: 'Случайный мэшап',
          inline: true
        },

        {
          name: '⠀',
          value: '**Служебные**'
        },
        {
          name: '`/settings`',
          value: 'Настройки',
          inline: true
        },
        {
          name: '`/donate`',
          value: 'Информация о Премиуме',
          inline: true
        },
        {
          name: '`/info`',
          value: 'Техническая информация о боте',
          inline: true
        },
        {
          name: '`/captcha`',
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
})
