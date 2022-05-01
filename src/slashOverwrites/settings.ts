import { Command } from '../SlashCommandManager'
import Utils, { ErrorMessageType } from '../Utils'

export default new Command({
  name: 'settings',
  cooldown: 5,
  adminOnly: true,
  premium: false,
  djOnly: false,
  execute: async ({ guild, client, respond, interaction }) => {
    if (!interaction) return

    const type = interaction.options.data[0].name
    if (type === 'prefix') {
      const prefix = interaction.options.get('префикс')
      const value = prefix?.value as string
      const length = value.length

      if (length < 1 || length > 5)
        return respond({
          embeds: [Utils.generateErrorMessage('Префикс может быть длиной от 1 до 5 символов.')]
        })

      client.db.setPrefix(value, guild.id).then(() => respond({
        embeds: [
          Utils.generateErrorMessage(`Префикс \`${value}\`успешно установлен.`,
            ErrorMessageType.NoTitle)
        ]
      }))
    } else if (type === 'dj') {
      const enable = interaction.options.get('включен')
      const value = enable?.value as boolean

      client.db.setAccessRoleEnabled(value, guild.id).then(async () => respond({
        embeds: [
          Utils.generateErrorMessage('**DJ режим ' + (value ? 'включён.**' +
            `\nПри включенном DJ режиме **бот будет работать** только у пользователей с ролью \`${await client.db.getAccessRole(guild.id)}\`.` : 'выключён.**'),
          ErrorMessageType.NoTitle)
        ]
      }))
    } else if (type === 'djrole') {
      const role = interaction.options.get('роль')
      const name = role?.role?.name as string

      client.db.setAccessRole(name, guild.id).then(() => respond({
        embeds: [Utils.generateErrorMessage(`DJ роль \`${name}\` установлена.`, ErrorMessageType.NoTitle)]
      }))
    } else if (type === 'announcements') {
      const enable = interaction.options.get('включены')
      const value = enable?.value as boolean

      client.db.setDisableAnnouncements(!value, guild.id).then(() => respond({
        embeds: [Utils.generateErrorMessage('Оповещения ' + (value ? 'включены.' : 'выключены.'), ErrorMessageType.NoTitle)]
      }))
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

      return respond({ embeds: [embed] })
    }
  }
})
