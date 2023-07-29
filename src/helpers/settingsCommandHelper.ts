import { ActionRowBuilder, BaseMessageOptions, ButtonBuilder, ButtonStyle } from 'discord.js'
import { getConfig } from '../db.js'
import Utils, { Emojis } from '../utils.js'
import { VkMusicBotClient } from '../client.js'
import BaseLoader from '../loaders/baseLoader.js'

function getBooleanButton(label: string, id: string, bool: boolean) {
  return new ButtonBuilder()
    .setCustomId(id)
    .setLabel(label)
    .setEmoji(bool ? Emojis.Yes : Emojis.No)
    .setStyle(bool ? ButtonStyle.Primary : ButtonStyle.Secondary)
}

export async function generateSettingsShowResponse(
  guildId: string,
  client: VkMusicBotClient
): Promise<BaseMessageOptions> {
  const config = await getConfig(guildId)

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
        name: `dj: ${djMode ? Emojis.Yes : Emojis.No}`,
        value:
          'DJ режим. Позволяет пользоваться ботом только если у пользователя есть определенная роль.'
      },
      {
        name: `djrole: ${Utils.escapeFormat(djRoleName)}`,
        value: 'Установка имени роли для DJ режима.'
      },
      {
        name: `announcements: ${announcements ? Emojis.Yes : Emojis.No}`,
        value: 'Включить/выключить сообщения о каждом играющем треке.'
      }
    ]
  }

  const loader = client.loaders.get(config.defaultSource) as BaseLoader

  const components = [
    new ActionRowBuilder<ButtonBuilder>().addComponents(
      getBooleanButton('DJ режим', 'settings,DJ', djMode),
      getBooleanButton('Оповещения', 'settings,announcements', announcements),
      new ButtonBuilder()
        .setCustomId('deleteMessage')
        .setStyle(ButtonStyle.Danger)
        .setEmoji(Emojis.TrashBin)
    ),
    new ActionRowBuilder<ButtonBuilder>().addComponents(
      new ButtonBuilder()
        .setLabel(`Источник по умолчанию: ${loader.displayName}`)
        .setEmoji(loader.emoji)
        .setStyle(ButtonStyle.Primary)
        .setCustomId('settings,loader')
    )
  ]

  return { embeds: [embed], components }
}
