import generateErrorMessage from '../tools/generateErrorMessage'

export default {
  name: 'settings',
  cooldown: 5,
  adminOnly: true,
  execute: async ({ guild, voice, text, client, captcha, respond, send, interaction }) => {
    // if (args.length === 0) {
    //   const embed = {
    //     title: '⚙ Настройки',
    //     color: 0x5181b8,
    //     fields: [
    //       {
    //         name: `\`prefix\`: \`${await client.db.getPrefix(guild.id)}\``,
    //         value: 'Настройка префикса.'
    //       },
    //       {
    //         name: `\`dj\`: ${await client.db.getAccessRoleEnabled(guild.id) ? '<:yes2:835498559805063169>' : '<:no2:835498572916195368>'}`,
    //         value: 'DJ режим. Позволяет пользоваться ботом только если у пользователя есть определенная роль.'
    //       },
    //       {
    //         name: `\`djrole\`: \`${await client.db.getAccessRole(guild.id)}\``,
    //         value: 'Установка имени роли для DJ режима.'
    //       },
    //       {
    //         name: `\`announcements\`: ${await client.db.getDisableAnnouncements(guild.id) ? '<:no2:835498572916195368>' : '<:yes2:835498559805063169>'}`,
    //         value: 'Включить/выключить сообщения о каждом играющем треке.'
    //       }
    //     ]
    //   }
    //   return respond({embeds: [embed]})
    // }
    const type = interaction.options.data[0].name
    if (type === 'prefix') {
      const prefix = interaction.options.get('префикс')
      
      if (prefix.value.length < 1 || prefix.value.length > 5) return respond({embeds: [generateErrorMessage('Префикс может быть длиной от 1 до 5 символов.')]})

      client.db.setPrefix(prefix.value, guild.id).then(() => respond({embeds: [generateErrorMessage(`Префикс \`${prefix.value}\`успешно установлен.`, 'info')]}))
    } else if (type === 'dj') {
      const enable = interaction.options.get('включен')

      client.db.setAccessRoleEnabled(enable.value, guild.id).then(() => respond({embeds: [generateErrorMessage('DJ режим ' + (enable.value ? 'включён.' : 'выключён.'), 'info')]}))
    } else if (type === 'djrole') {
      const role = interaction.options.get('роль')
      
      client.db.setAccessRole(role.role.name, guild.id).then(() => respond({embeds: [generateErrorMessage('DJ роль установлена.', 'info')]}))
    } else if (type === 'announcements') {
      const enable = interaction.options.get('включены')

      client.db.setDisableAnnouncements(!enable.value, guild.id).then(() => respond({embeds: [generateErrorMessage('Оповещения ' + (!enable.value ? 'включены.' : 'выключены.'), 'info')]}))
    } else if (type === 'show') {
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
      return respond({embeds: [embed]})
    }
  }
}