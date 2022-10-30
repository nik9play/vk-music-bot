import { Command } from '../SlashCommandManager.js'
import Utils, { ErrorMessageType } from '../Utils.js'

export default new Command({
  name: 'settings',
  cooldown: 5,
  adminOnly: true,
  premium: false,
  djOnly: false,
  execute: async ({ guild, client, respond, interaction }) => {
    const type = interaction.options.getSubcommand()
    if (type === 'prefix') {
      const prefix = interaction.options.getString('префикс') as string
      const length = prefix.length

      if (length < 1 || length > 5) {
        await respond({
          embeds: [Utils.generateErrorMessage('Префикс может быть длиной от 1 до 5 символов.')]
        })
        return
      }

      await client.db.setPrefix(prefix, guild.id)
      await respond({
        embeds: [
          Utils.generateErrorMessage(
            `Префикс \`${Utils.escapeFormat(prefix)}\`успешно установлен.`,
            ErrorMessageType.NoTitle
          )
        ]
      })
    } else if (type === 'dj') {
      const enable = interaction.options.getBoolean('включен') as boolean

      await client.db.setAccessRoleEnabled(enable, guild.id)
      await respond({
        embeds: [
          Utils.generateErrorMessage(
            '**DJ режим ' +
              (enable
                ? 'включён.**' +
                  `\nПри включенном DJ режиме **бот будет работать** только у пользователей с ролью \`${await client.db.getAccessRole(
                    guild.id
                  )}\`.`
                : 'выключён.**'),
            ErrorMessageType.NoTitle
          )
        ]
      })
    } else if (type === 'djrole') {
      const role = interaction.options.getRole('роль')
      const name = role?.name as string

      if (name === '@everyone' || name === '@here') {
        await respond({
          embeds: [
            Utils.generateErrorMessage(`Нельзя установить роль ${Utils.escapeFormat(name)}.`, ErrorMessageType.Error)
          ]
        })
        return
      }

      await client.db.setAccessRole(name, guild.id)
      await respond({
        embeds: [
          Utils.generateErrorMessage(`DJ роль "${Utils.escapeFormat(name)}" установлена.`, ErrorMessageType.NoTitle)
        ]
      })
    } else if (type === 'announcements') {
      const enable = interaction.options.getBoolean('включены')

      await client.db.setDisableAnnouncements(!enable, guild.id)
      await respond({
        embeds: [
          Utils.generateErrorMessage('Оповещения ' + (enable ? 'включены.' : 'выключены.'), ErrorMessageType.NoTitle)
        ]
      })
    } else if (type === 'show') {
      const embed = {
        title: '⚙ Настройки',
        color: 0x5181b8,
        fields: [
          {
            name: `prefix: ${Utils.escapeFormat(await client.db.getPrefix(guild.id))}`,
            value: 'Настройка префикса.'
          },
          {
            name: `dj: ${
              (await client.db.getAccessRoleEnabled(guild.id))
                ? '<:yes2:835498559805063169>'
                : '<:no2:835498572916195368>'
            }`,
            value: 'DJ режим. Позволяет пользоваться ботом только если у пользователя есть определенная роль.'
          },
          {
            name: `djrole: ${Utils.escapeFormat(await client.db.getAccessRole(guild.id))}`,
            value: 'Установка имени роли для DJ режима.'
          },
          {
            name: `announcements: ${
              (await client.db.getDisableAnnouncements(guild.id))
                ? '<:no2:835498572916195368>'
                : '<:yes2:835498559805063169>'
            }`,
            value: 'Включить/выключить сообщения о каждом играющем треке.'
          }
        ]
      }

      await respond({ embeds: [embed] })
    }
  }
})
