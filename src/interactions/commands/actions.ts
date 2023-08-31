import { EmbedBuilder, SlashCommandBuilder, userMention } from 'discord.js'
import { CommandCustomInteraction } from '../commandInteractions.js'
import Utils from '../../utils.js'

const actionTypeNames: Record<'button' | 'command' | 'modal', string> = {
  button: 'Кнопка',
  command: 'Команда',
  modal: 'Модальное окно'
}

export const interaction: CommandCustomInteraction = {
  name: 'actions',
  adminOnly: true,
  premium: false,
  data: new SlashCommandBuilder()
    .setName('actions')
    .setDescription('Просмотр последних 10 действий пользователей')
    .setDMPermission(false),
  execute: async ({ respond, client, guild }) => {
    const embed = new EmbedBuilder()
      .setTitle('Действия пользователей')
      .setColor(0x235dff)
      .setFooter({ text: 'Отображаются последние 10 действий.' })

    let description = 'Список действий пока пуст.'

    const actions = client.userActionsManager.getActions(guild.id)

    if (actions.length > 0) {
      description = actions
        .map(
          (action, i) =>
            `${i + 1}. ${userMention(action.memberId)} – ${actionTypeNames[action.type]} «${
              action.name
            }» (${Utils.relativeTime(action.timestamp)}, в ${Utils.longTime(action.timestamp)})`
        )
        .join('\n')
    }

    embed.setDescription(description)

    respond({ embeds: [embed], ephemeral: true })
  }
}
