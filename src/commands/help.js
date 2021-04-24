export default {
  name: "help",
  cooldown: 1,
  adminOnly: true,
  aliases: ["h"],
  execute: async function(message) {
    const embed = {
      title: "❔ Справка",
      color: 0x5181b8,
      fields: [
        {
          name: "⠀",
          value: "**Музыка**"
        },
        {
          name: "`play`, `p`",
          value: "Добавить в очереди трек/треки. Принимает название трека, ID трека, ссылку на плейлист или на пользователя. Также добавляет по ID пользователя при помощи префикса `>` (например: `-vp >nikitabogun`)",
          inline: false
        },
        {
          name: "`stop`, `s`",
          value: "Остановить воспроизведение и очистить очередь",
          inline: true
        },
        {
          name: "`skip`, `n`",
          value: "Пропуск текущего трека",
          inline: true
        },
        {
          name: "`pause`, `ps`",
          value: "Поставить текущий трек на паузу. Бот выйдет из канала через 20 минут, если не включен режим 24/7",
          inline: true
        },
        {
          name: "`search`",
          value: "Поиск по базе ВК. Выводит 5 результатов с выбором",
          inline: true
        },
        {
          name: "`leave`",
          value: "Выход из канала",
          inline: true
        },
        {
          name: ":star: `bass`",
          value: "Включить бас буст. Доступные уровни: `none`, `low`, `medium`, `high`",
          inline: true
        },

        {
          name: "⠀",
          value: "**Очередь**"
        },
        {
          name: "`queue`, `q`",
          value: "Просмотр очереди",
          inline: true
        },
        {
          name: ":star: `shuffle`, `sh`",
          value: "Перемешать очередь",
          inline: true
        },
        {
          name: ":star: `24/7`",
          value: "Режим 24/7. Бот не выйдет из канала после окончания очереди, паузы и выхода всех людей из канала",
          inline: true
        },
        {
          name: "`loop`, `l`",
          value: "Зацикливание. `loop queue` — зацикливание очереди, `loop song` — зацикливание трека, `loop off` — отключение зацикливания",
          inline: true
        },
        {
          name: "`gachi`",
          value: "Случайный гачи-ремикс",
          inline: true
        },
        {
          name: "`mashup`",
          value: "Случайный мэшап",
          inline: true
        },

        {
          name: "⠀",
          value: "**Служебные**"
        },
        {
          name: "`settings`",
          value: "Настройки. Введите `settings` для подробностей",
          inline: true
        },
        {
          name: "`donate`",
          value: "Информация о Премиуме",
          inline: true
        },
        {
          name: "`info`",
          value: "Техническая информация о боте",
          inline: true
        },
        {
          name: "`captcha`",
          value: "Ввод капчи",
          inline: true
        },

        {
          name: "Что-то непонятно?",
          value: "Прочитайте [справку о командах](https://vkmusicbot.megaworld.space/commands) или [FAQ](https://vkmusicbot.megaworld.space/faq)."
        }
      ]
    }

    message.channel.send({embed: embed})
  }
}