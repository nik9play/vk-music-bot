import { ActionRowBuilder, BaseMessageOptions, ButtonBuilder, ButtonStyle, EmbedBuilder } from 'discord.js'
import { KazagumoPlayer, KazagumoTrack } from 'kazagumo'

import Utils from '../utils.js'
import { MenuButtonType } from '../helpers/menuCommandHelper.js'

const repeatEmojis = {
  none: '<:repeat_no:1052960708641431642>',
  queue: '<:repeat_queue:1052960645907226704>',
  track: '<:repeat_one_btn:1052960682666102815>'
}

export default function generatePlayerStartMessage(player: KazagumoPlayer, track: KazagumoTrack): BaseMessageOptions {
  const row = new ActionRowBuilder<ButtonBuilder>().addComponents([
    new ButtonBuilder()
      .setCustomId(`menu_${MenuButtonType.Pause}`)
      .setEmoji(player?.paused ? '<:play_btn:1052960565674393640>' : '<:pause_btn:1052960594065641502>')
      .setStyle(player?.paused ? ButtonStyle.Primary : ButtonStyle.Secondary)
      .setDisabled(!player?.queue.current),
    new ButtonBuilder()
      .setCustomId(`menu_${MenuButtonType.Skip}`)
      .setEmoji('<:skip:1052960924996223037>')
      .setStyle(ButtonStyle.Secondary)
      .setDisabled(!player?.queue.current),
    new ButtonBuilder()
      .setCustomId(`menu_${MenuButtonType.Stop}`)
      .setEmoji('<:stop_btn:1052960619940302868>')
      .setStyle(ButtonStyle.Secondary)
      .setDisabled(!player?.queue.current),
    new ButtonBuilder()
      .setCustomId(`menu_${MenuButtonType.Queue}`)
      .setEmoji('<:queue:1052960903047426099>')
      .setStyle(ButtonStyle.Secondary)
      .setDisabled(!player?.queue),
    //new MessageButton().setCustomId('menu_update').setEmoji('🔃').setStyle(ButtonStyle.Primary),
    new ButtonBuilder()
      .setCustomId(`menu_${MenuButtonType.Repeat}`)
      .setEmoji(repeatEmojis[player?.loop ?? 'none'])
      .setStyle(player.loop === 'none' ? ButtonStyle.Secondary : ButtonStyle.Primary)
  ])

  return {
    embeds: [
      new EmbedBuilder().setColor(0x5181b8).setAuthor({
        name: `Сейчас играет ${Utils.escapeFormat(track.author)} — ${Utils.escapeFormat(track.title)}.`,
        iconURL: track.thumbnail
      })
    ],
    components: [row]
  }
}
