import {
  ActionRowBuilder,
  ButtonBuilder,
  EmbedBuilder,
  ButtonStyle,
  InteractionReplyOptions,
  InteractionUpdateOptions
} from 'discord.js'
import BotPlayer from '../modules/botPlayer.js'
import Utils, { Emojis } from '../utils.js'

export function generateQueueResponse(
  page: number,
  player: BotPlayer
): InteractionReplyOptions & InteractionUpdateOptions {
  const queue = player.queue
  const embed = new EmbedBuilder().setAuthor({ name: 'Треки в очереди' }).setColor(0x5181b8)

  const multiple = 10
  page = page < 0 ? 1 : page

  const end = page * multiple
  const start = end - multiple

  const tracks = queue.slice(start, end)

  if (player.current)
    embed.addFields({
      name: 'Сейчас играет',
      value: `${player.current?.author} — ${player.current?.title} (${Utils.formatTime(
        player.player.position
      )}/${Utils.formatTime(player.current?.duration ?? 0)})`
    })
  //console.log(queue.current)

  if (!tracks.length) embed.setDescription(`Нет треков на странице \`${page}\`.`)
  else {
    embed.setDescription(
      tracks
        .map(
          (track, i) =>
            `${start + ++i}. ${Utils.escapeFormat(track.author)} — ${Utils.escapeFormat(
              track.title
            )}`
        )
        .join('\n')
    )
  }

  const maxPages = Math.ceil(queue.length / multiple)

  embed.setFooter({
    text: `Страница ${page > maxPages ? maxPages : page} из ${maxPages}`
  })

  const components = [
    new ActionRowBuilder<ButtonBuilder>().addComponents([
      new ButtonBuilder()
        .setCustomId(`queue,${page - 1}`)
        .setEmoji(Emojis.ChevronLeft)
        .setStyle(ButtonStyle.Primary)
        .setDisabled(page - 1 <= 0),
      new ButtonBuilder()
        .setCustomId(`queue,${page + 1}`)
        .setEmoji(Emojis.ChevronRight)
        .setStyle(ButtonStyle.Primary)
        .setDisabled(page + 1 > maxPages),
      new ButtonBuilder()
        .setCustomId('deleteMessage')
        .setStyle(ButtonStyle.Danger)
        .setEmoji(Emojis.TrashBin)
    ])
  ]

  return { embeds: [embed], components }
}
