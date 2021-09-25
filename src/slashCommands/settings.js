import generateErrorMessage from '../tools/generateErrorMessage'

/* eslint-disable no-case-declarations */
export default {
  name: 'settings',
  cooldown: 5,
  adminOnly: true,
  execute: async ({ guild, client, args, respond }) => {
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
        if (args.length != 2) return respond({embeds: [generateErrorMessage('Неверное количество аргументов.')]})
        
        if (args[1] < 1 || args[1] > 5) return respond({embeds: [generateErrorMessage('Префикс может быть длиной от 1 до 5 символов.')]})

        client.db.setPrefix(args[1], guild.id).then(() => respond({embeds: [generateErrorMessage(`Префикс \`${args[1]}\`успешно установлен.`, 'notitle')]}))
        break
      case 'djrole':
        let roleName = args.slice(1).join(' ')

        if (!roleName)
          return respond({embeds: [generateErrorMessage('Неверное имя роли.')]})

        client.db.setAccessRole(roleName, guild.id).then(() => respond({embeds: [generateErrorMessage('DJ роль установлена.', 'notitle')]}))
        break
      case 'dj':
        if (!args[1] || (args[1] !== 'on' && args[1] !== 'off'))
          return respond({embeds: [generateErrorMessage('Используйте `on`/`off`.')]})

        if (args[1] === 'on')
          client.db.setAccessRoleEnabled(true, guild.id).then(() => respond({embeds: [generateErrorMessage('DJ режим включён.', 'notitle')]}))
        else if (args[1] === 'off')
          client.db.setAccessRoleEnabled(false, guild.id).then(() => respond({embeds: [generateErrorMessage('DJ режим выключён.', 'notitle')]}))
        break
      case 'announcements':
        if (!args[1] || (args[1] !== 'on' && args[1] !== 'off'))
          return respond({embeds: [generateErrorMessage('Используйте `on`/`off`.')]})

        if (args[1] === 'on')
          client.db.setDisableAnnouncements(false, guild.id).then(() => respond({embeds: [generateErrorMessage('Оповещения включены.', 'notitle')]}))
        else if (args[1] === 'off')
          client.db.setDisableAnnouncements(true, guild.id).then(() => respond({embeds: [generateErrorMessage('Оповещения выключены.', 'notitle')]}))
        break
      }
  }
}