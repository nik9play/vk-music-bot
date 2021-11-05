/* eslint-disable no-case-declarations */
export default {
  name: "settings",
  cooldown: 5,
  adminOnly: true,
  execute: async (message, args) => {
    if (args.length == 0) {
      const embed = {
        title: "⚙ Настройки",
        color: 0x5181b8,
        fields: [
          {
            name: `\`prefix\`: \`${await message.client.db.getPrefix(message.guild.id)}\``,
            value: `Настройка префикса.`
          },
          {
            name: `\`dj\`: ${await message.client.db.getAccessRoleEnabled(message.guild.id) ? "<:yes2:835498559805063169>" : "<:no2:835498572916195368>"}`,
            value: "DJ режим. Позволяет пользоваться ботом только если у пользователя есть определенная роль."
          },
          {
            name: `\`djrole\`: \`${await message.client.db.getAccessRole(message.guild.id)}\``,
            value: `Установка имени роли для DJ режима.`
          },
          {
            name: `\`announcements\`: ${await message.client.db.getDisableAnnouncements(message.guild.id) ? "<:no2:835498572916195368>" : "<:yes2:835498559805063169>"}`,
            value: `Включить/выключить сообщения о каждом играющем треке.`
          }
        ]
      }
      return message.channel.send({embed: embed})
    }
    switch (args[0]) {
      // case "perms":
      //   if (args.length != 4 && args.length != 2) return message.reply("неверное количество аргументов.")
        
      //   const role = message.mentions.roles.first()
      //   const user = message.mentions.users.first()

      //   let id

      //   if (user) {
      //     id = user.id
      //   } else if (role) {
      //     id = role.id
      //   } else
      //     return message.reply("роль или пользователь не найдены.")

      //   if (args.length == 2) {
      //     return message.channel.send({embed: {
      //       description: user ? `**Отображение прав пользователя <@${id}>**` : `**Отображение прав роли <@&${id}>**`,
      //       color: 0x5181b8,
      //       fields: [
      //         {
      //           name: "Добавление в очередь",
      //           value: await message.client.db.checkPerm(id, "ADD_TO_QUEUE", message.guild.id) ? "<:yes2:835498559805063169> разрешено" : "<:no2:835498572916195368> запрещено"
      //         },
      //         {
      //           name: "Управление очередью",
      //           value: await message.client.db.checkPerm(id, "MANAGE_QUEUE", message.guild.id) ? "<:yes2:835498559805063169> разрешено" : "<:no2:835498572916195368> запрещено"
      //         },
      //         {
      //           name: "Просмотр очереди",
      //           value: await message.client.db.checkPerm(id, "VIEW_QUEUE", message.guild.id) ? "<:yes2:835498559805063169> разрешено" : "<:no2:835498572916195368> запрещено"
      //         },
      //         {
      //           name: "Управление плеером",
      //           value: await message.client.db.checkPerm(id, "MANAGE_PLAYER", message.guild.id) ? "<:yes2:835498559805063169> разрешено" : "<:no2:835498572916195368> запрещено"
      //         }
      //       ]
      //     }})

      //   } else {
      //     if (!check(args[2].toUpperCase(), args[3])) return message.reply("неверное разрешение или неверное действие. " +
      //     "\nДоступные разрешения: `ALL`, `ADD_TO_QUEUE`, `MANAGE_QUEUE`, `MANAGE_PLAYER`, `VIEW_QUEUE`. Доступные действия: `allow`, `deny`, `reset`.")

      //     message.client.db.setPerm(id, args[2].toUpperCase(), args[3], message.guild.id)
      //     .then(() => {
      //       message.reply("разрешения успешно установлены!")
      //     })
      //     .catch(() => message.reply("ошибка при установки разрешений."))
      //   }
      //   break
      case "prefix":
        if (args.length != 2) return message.reply("неверное количество аргументов.")
        
        if (args[1] < 1 || args[1] > 5) return message.reply("префикс может быть длиной от 1 до 5 символов.")

        await message.client.db.setPrefix(args[1], message.guild.id)
        message.client.prefixes.set(message.guild.id, args[1])
        message.reply(`префикс \`${args[1]}\`успешно установлен!`)
        break
      case "djrole":
        //console.log(message.mentions.roles.first())
        const role = message.mentions.roles.first()
        
        let roleName
        
        if (role)
          roleName = role.name
        else
          roleName = args.slice(1).join(' ')

        if (!roleName)
          return message.reply("неверное имя роли.")

        message.client.db.setAccessRole(roleName, message.guild.id).then(() => message.reply("DJ роль установлена."))
        break
      case "dj":
        if (!args[1])
          return message.reply("используйте `on`/`off`.")
        if (args[1] !== "on" && args[1] !== "off")
          return message.reply("используйте `on`/`off`.")

        if (args[1] === "on")
          message.client.db.setAccessRoleEnabled(true, message.guild.id).then(() => message.reply("<:yes2:835498559805063169> DJ режим включен."))
        else if (args[1] === "off")
          message.client.db.setAccessRoleEnabled(false, message.guild.id).then(() => message.reply("<:no2:835498572916195368> DJ режим выключен."))
        break
      case "announcements":
        if (!args[1])
          return message.reply("используйте `on`/`off`.")
        if (args[1] !== "on" && args[1] !== "off")
          return message.reply("используйте `on`/`off`.")

        if (args[1] === "on")
          message.client.db.setDisableAnnouncements(false, message.guild.id).then(() => message.reply("<:yes2:835498559805063169> сообщения включены."))
        else if (args[1] === "off")
          message.client.db.setDisableAnnouncements(true, message.guild.id).then(() => message.reply("<:no2:835498572916195368> сообщения выключены."))
        break
      }
  }
}

// function check(perm, action) {
//   const actions = ["allow", "deny", "reset"]
//   const perms = ["ALL", "ADD_TO_QUEUE", "MANAGE_QUEUE", "MANAGE_PLAYER", "VIEW_QUEUE"]

//   return (perms.includes(perm) && actions.includes(action))
// }