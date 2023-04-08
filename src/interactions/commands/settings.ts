import { getConfig, updateConfig } from '../../db.js'
import Utils, { ErrorMessageType } from '../../utils.js'
import { CommandCustomInteraction } from '../commandInteractions.js'

export const interaction: CommandCustomInteraction = {
  name: 'settings',
  cooldown: 5,
  adminOnly: true,
  premium: false,
  djOnly: false,
  execute: async ({ guild, respond, interaction }) => {
    const type = interaction.options.getSubcommand()
    const config = await getConfig(guild.id)

    // if (type === 'prefix') {
    //   const prefix = interaction.options.getString('префикс', true)
    //   const length = prefix.length

    //   if (length < 1 || length > 5) {
    //     await respond({
    //       embeds: [Utils.generateErrorMessage('Префикс может быть длиной от 1 до 5 символов.')]
    //     })
    //     return
    //   }

    //   await client.db.setPrefix(prefix, guild.id)
    //   await respond({
    //     embeds: [
    //       Utils.generateErrorMessage(
    //         `Префикс \`${Utils.escapeFormat(prefix)}\`успешно установлен.`,
    //         ErrorMessageType.NoTitle
    //       )
    //     ]
    //   })
    // } else

    if (type === 'dj') {
      const enable = interaction.options.getBoolean('включен', true)

      await updateConfig(guild.id, { djMode: enable })

      await respond(
        {
          embeds: [
            Utils.generateErrorMessage(
              '**DJ режим ' +
                (enable
                  ? 'включён.**' +
                    `\nПри включенном DJ режиме **бот будет работать** только у пользователей с ролью \`${config.djRoleName}\`.`
                  : 'выключён.**'),
              ErrorMessageType.NoTitle
            )
          ]
        },
        20_000
      )
    } else if (type === 'djrole') {
      const role = interaction.options.getRole('роль', true)
      const name = role.name

      if (name === '@everyone' || name === '@here') {
        await respond(
          {
            embeds: [
              Utils.generateErrorMessage(`Нельзя установить роль ${Utils.escapeFormat(name)}.`, ErrorMessageType.Error)
            ]
          },
          10_000
        )
        return
      }

      await updateConfig(guild.id, { djRoleName: name })
      await respond(
        {
          embeds: [
            Utils.generateErrorMessage(`DJ роль "${Utils.escapeFormat(name)}" установлена.`, ErrorMessageType.NoTitle)
          ]
        },
        10_000
      )
    } else if (type === 'announcements') {
      const enable = interaction.options.getBoolean('включены', true)

      await updateConfig(guild.id, { announcements: enable })
      await respond(
        {
          embeds: [
            Utils.generateErrorMessage('Оповещения ' + (enable ? 'включены.' : 'выключены.'), ErrorMessageType.NoTitle)
          ]
        },
        10_000
      )
    } else if (type === 'show') {
      const { djMode, djRoleName, announcements } = config

      const embed = {
        title: '⚙ Настройки',
        color: 0x5181b8,
        fields: [
          // {
          //   name: `prefix: ${Utils.escapeFormat(await client.db.getPrefix(guild.id))}`,
          //   value: 'Настройка префикса.'
          // },
          {
            name: `dj: ${djMode ? '<:yes2:835498559805063169>' : '<:no2:835498572916195368>'}`,
            value: 'DJ режим. Позволяет пользоваться ботом только если у пользователя есть определенная роль.'
          },
          {
            name: `djrole: ${Utils.escapeFormat(djRoleName)}`,
            value: 'Установка имени роли для DJ режима.'
          },
          {
            name: `announcements: ${announcements ? '<:yes2:835498559805063169>' : '<:no2:835498572916195368>'}`,
            value: 'Включить/выключить сообщения о каждом играющем треке.'
          }
        ]
      }

      await respond({ embeds: [embed] }, 30_000)
    }
  }
}
