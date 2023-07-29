import { PermissionFlagsBits, SlashCommandBuilder } from 'discord.js'
import { getConfig, updateConfig } from '../../db.js'
import Utils, { ErrorMessageType } from '../../utils.js'
import { CommandCustomInteraction } from '../commandInteractions.js'
import { generateSettingsShowResponse } from '../../helpers/settingsCommandHelper.js'

export const interaction: CommandCustomInteraction = {
  name: 'settings',
  cooldown: 5,
  adminOnly: true,
  data: new SlashCommandBuilder()
    .setName('settings')
    .setDescription('Настройки')
    .addSubcommand((subcommand) =>
      subcommand
        .setName('dj')
        .setDescription('Переключение DJ режима')
        .addBooleanOption((option) =>
          option.setName('включен').setDescription('Состояние DJ режима').setRequired(true)
        )
    )
    .addSubcommand((subcommand) =>
      subcommand
        .setName('djrole')
        .setDescription('Роль DJ режима')
        .addRoleOption((option) => option.setName('роль').setDescription('Роль').setRequired(true))
    )
    .addSubcommand((subcommand) =>
      subcommand
        .setName('announcements')
        .setDescription('Настройка поведения оповещений')
        .addBooleanOption((option) =>
          option.setName('включены').setDescription('Состояние оповещений').setRequired(true)
        )
    )
    .addSubcommand((subcommand) =>
      subcommand.setName('show').setDescription('Показать текущие настройки')
    )
    .setDMPermission(false)
    .setDefaultMemberPermissions(PermissionFlagsBits.ManageGuild),
  execute: async ({ guild, respond, interaction, client }) => {
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
              Utils.generateErrorMessage(
                `Нельзя установить роль ${Utils.escapeFormat(name)}.`,
                ErrorMessageType.Error
              )
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
            Utils.generateErrorMessage(
              `DJ роль "${Utils.escapeFormat(name)}" установлена.`,
              ErrorMessageType.NoTitle
            )
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
            Utils.generateErrorMessage(
              'Оповещения ' + (enable ? 'включены.' : 'выключены.'),
              ErrorMessageType.NoTitle
            )
          ]
        },
        10_000
      )
    } else if (type === 'show') {
      await respond(await generateSettingsShowResponse(guild.id, client))
    }
  }
}
