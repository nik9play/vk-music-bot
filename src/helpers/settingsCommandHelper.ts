import {
  ActionRowBuilder,
  ButtonBuilder,
  ButtonStyle,
  InteractionReplyOptions,
  InteractionUpdateOptions
} from 'discord.js'
import { getConfig } from '../db.js'
import Utils, { Emojis } from '../utils.js'
import { VkMusicBotClient } from '../client.js'
import BaseLoader from '../loaders/baseLoader.js'

function getBooleanButton(label: string, id: string, bool: boolean, enabled = true) {
  return new ButtonBuilder()
    .setCustomId(id)
    .setLabel(label)
    .setEmoji(bool ? Emojis.Yes : Emojis.No)
    .setStyle(bool ? ButtonStyle.Primary : ButtonStyle.Secondary)
    .setDisabled(!enabled)
}

export async function generateSettingsShowResponse(
  guildId: string,
  client: VkMusicBotClient
): Promise<InteractionReplyOptions & InteractionUpdateOptions> {
  const config = await getConfig(guildId)

  const { djMode, djRoleName, announcements, enable247 } = config
  const loader = client.loaders.get(config.defaultSource) as BaseLoader

  const embed = {
    title: '⚙ Настройки',
    color: 0x0ea5e9,
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
      },
      {
        name: `:star: 24/7: ${enable247 ? Emojis.Yes : Emojis.No}`,
        value: 'При включенном режиме 24/7 бот не выходит из канала автоматически.'
      },
      {
        name: `default-source: ${loader.emoji} ${loader.displayName}`,
        value: 'Установка источника для поиска музыки по умолчанию.'
      }
    ]
  }

  const components = [
    new ActionRowBuilder<ButtonBuilder>().addComponents(
      getBooleanButton('DJ режим', 'settings,DJ', djMode),
      getBooleanButton('Оповещения', 'settings,announcements', announcements),
      getBooleanButton('Режим 24/7', 'settings,247', enable247, config.premium)
    ),
    new ActionRowBuilder<ButtonBuilder>().addComponents(
      new ButtonBuilder()
        .setLabel(`Источник по умолчанию: ${loader.displayName}`)
        .setEmoji(loader.emoji)
        .setStyle(ButtonStyle.Primary)
        .setCustomId('settings,loader')
      // new ButtonBuilder()
      //   .setCustomId('deleteMessage')
      //   .setStyle(ButtonStyle.Danger)
      //   .setEmoji(Emojis.TrashBin)
    )
  ]

  return { embeds: [embed], components, ephemeral: true }
}
