import {Command} from '../SlashCommandManager'
import Utils, {ErrorMessageType} from '../Utils'

/* eslint-disable no-case-declarations */
export default new Command({
  name: 'settings',
  cooldown: 5,
  adminOnly: true,
  premium: false,
  djOnly: false,
  execute: async ({ guild, client, args, respond, message }) => {
    if (args.length == 0) {
      const embed = {
        title: '⚙ Настройки',
        color: 0x5181b8,
        fields: [
          {
            name: `\`prefix\`: \`${await client.db.getPrefix(guild.id)}\``,
            value: 'Настройка префикса.'
          },
          {
            name: `\`dj\`: ${await client.db.getAccessRoleEnabled(guild.id) ? '<:yes2:835498559805063169>' : '<:no2:835498572916195368>'}`,
            value: 'DJ режим. Позволяет пользоваться ботом только если у пользователя есть определенная роль.'
          },
          {
            name: `\`djrole\`: \`${await client.db.getAccessRole(guild.id)}\``,
            value: 'Установка имени роли для DJ режима.'
          },
          {
            name: `\`announcements\`: ${await client.db.getDisableAnnouncements(guild.id) ? '<:no2:835498572916195368>' : '<:yes2:835498559805063169>'}`,
            value: 'Включить/выключить сообщения о каждом играющем треке.'
          }
        ]
      }
      return respond({ embeds: [embed], ephemeral: true })
    }

    switch (args[0]) {
    case 'prefix':
      if (args.length != 2) return respond({embeds: [Utils.generateErrorMessage('Неверное количество аргументов.')]})
        
      if (args[1].length < 1 || args[1].length > 5) return respond({embeds: [Utils.generateErrorMessage('Префикс может быть длиной от 1 до 5 символов.')]})

      client.db.setPrefix(args[1], guild.id).then(() => respond({embeds: [Utils.generateErrorMessage(`Префикс \`${args[1]}\`успешно установлен.`, ErrorMessageType.NoTitle)]}))
      break
    case 'djrole':
      const roleName = args.slice(1).join(' ')

      if (message?.mentions.users.size) {
        return respond({embeds: [Utils.generateErrorMessage('Неверное имя роли.')]})
      }

      if (message?.mentions.roles.size) {
        const role = message.mentions.roles.first()

        if (role)
          client.db.setAccessRole(role.name, guild.id).then(() =>
            respond({embeds: [Utils.generateErrorMessage(`DJ роль \`${role.name}\` установлена.`, ErrorMessageType.NoTitle)]})
          )
        return
      }

      if (!roleName)
        return respond({embeds: [Utils.generateErrorMessage('Неверное имя роли.')]})

      client.db.setAccessRole(roleName, guild.id).then(() => respond({
        embeds: [Utils.generateErrorMessage(`DJ роль \`${roleName}\` установлена.`, ErrorMessageType.NoTitle)]
      }))
      break
    case 'dj':
      if (!args[1] || (args[1] !== 'on' && args[1] !== 'off'))
        return respond({embeds: [Utils.generateErrorMessage('Используйте `on`/`off`.')]})

      if (args[1] === 'on')
        client.db.setAccessRoleEnabled(true, guild.id).then(async () => respond({embeds: [Utils.generateErrorMessage('DJ режим включён.' +
          `\nПри включенном DJ режиме **бот будет работать** только у пользователей с ролью \`${await client.db.getAccessRole(guild.id)}\`.`, ErrorMessageType.NoTitle)]}))
      else if (args[1] === 'off')
        client.db.setAccessRoleEnabled(false, guild.id).then(() => respond({embeds: [Utils.generateErrorMessage('DJ режим выключён.', ErrorMessageType.NoTitle)]}))
      break
    case 'announcements':
      if (!args[1] || (args[1] !== 'on' && args[1] !== 'off'))
        return respond({embeds: [Utils.generateErrorMessage('Используйте `on`/`off`.')]})

      if (args[1] === 'on')
        client.db.setDisableAnnouncements(false, guild.id).then(() => respond({
          embeds: [Utils.generateErrorMessage('Оповещения включены.', ErrorMessageType.NoTitle)]
        }))
      else if (args[1] === 'off')
        client.db.setDisableAnnouncements(true, guild.id).then(() => respond({
          embeds: [Utils.generateErrorMessage('Оповещения выключены.', ErrorMessageType.NoTitle)]
        }))
      break
    }
  }
})