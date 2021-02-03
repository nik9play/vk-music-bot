/* eslint-disable no-case-declarations */
export default {
  name: "settings",
  cooldown: 5,
  execute: async (message, args) => {
    if (args.length == 0) return message.reply("список возможных настроек: `perms`, `prefix`.")

    switch (args[0]) {
      case "perms":
        if (args.length != 4 && args.length != 2) return message.reply("неверное количество аргументов.")
        
        const role = message.mentions.roles.first()
        const user = message.mentions.users.first()

        let id

        if (user) {
          id = user.id
        } else if (role) {
          id = role.id
        } else
          return message.reply("роль или пользователь не найдены.")

        if (args.length == 2) {
          return message.channel.send({embed: {
            description: user ? `**Отображение прав пользователя <@${id}>**` : `**Отображение прав роли <@&${id}>**`,
            color: 0x5181b8,
            fields: [
              {
                name: "Добавление в очередь",
                value: await message.client.configDB.checkPerm(id, "ADD_TO_QUEUE", message.guild.id) ? "<:yes:806179743766413323> разрешено" : "<:no:806178831994978385> запрещено"
              },
              {
                name: "Управление очередью",
                value: await message.client.configDB.checkPerm(id, "MANAGE_QUEUE", message.guild.id) ? "<:yes:806179743766413323> разрешено" : "<:no:806178831994978385> запрещено"
              },
              {
                name: "Просмотр очереди",
                value: await message.client.configDB.checkPerm(id, "VIEW_QUEUE", message.guild.id) ? "<:yes:806179743766413323> разрешено" : "<:no:806178831994978385> запрещено"
              },
              {
                name: "Управление плеером",
                value: await message.client.configDB.checkPerm(id, "MANAGE_PLAYER", message.guild.id) ? "<:yes:806179743766413323> разрешено" : "<:no:806178831994978385> запрещено"
              }
            ]
          }})

        } else {
          if (!check(args[2].toUpperCase(), args[3])) return message.reply("неверное разрешение или неверное действие. " +
          "\nДоступные разрешения: `ALL`, `ADD_TO_QUEUE`, `MANAGE_QUEUE`, `MANAGE_PLAYER`, `VIEW_QUEUE`. Доступные действия: `allow`, `deny`, `reset`.")

          message.client.configDB.setPerm(id, args[2].toUpperCase(), args[3], message.guild.id)
          .then(() => {
            message.reply("разрешения успешно установлены!")
          })
          .catch(() => message.reply("ошибка при установки разрешений."))
        }
        break
      case "prefix":
        if (args.length != 2) return message.reply("неверное количество аргументов.")
        
        if (args[1] < 1 || args[1] > 5) return message.reply("префикс может быть длиной от 1 до 5 символов.")

        await message.client.configDB.setPrefix(args[1], message.guild.id)
        message.client.prefixes.set(message.guild.id, args[1])
        message.reply(`префикс \`${args[1]}\`успешно установлен!`)
      }
  }
}

function check(perm, action) {
  const actions = ["allow", "deny", "reset"]
  const perms = ["ALL", "ADD_TO_QUEUE", "MANAGE_QUEUE", "MANAGE_PLAYER", "VIEW_QUEUE"]

  return (perms.includes(perm) && actions.includes(action))
}