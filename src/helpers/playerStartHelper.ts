import { ActionRowBuilder, BaseMessageOptions, ButtonBuilder, ButtonStyle, EmbedBuilder } from 'discord.js'
import { KazagumoPlayer, KazagumoTrack } from 'kazagumo'

import Utils from '../utils.js'
import { MenuButtonType } from '../helpers/menuCommandHelper.js'

const repeatEmojis = {
  none: '<:repeat_no:1052960708641431642>',
  queue: '<:repeat_queue:1052960645907226704>',
  track: '<:repeat_one_btn:1052960682666102815>'
}

const progressEmojis = {
  mid0: '<:progress_mid_0:1084166897790103695>',
  mid05: '<:progress_mid_05:1084166907495731230>',
  mid1: '<:progress_mid_1:1084166901699186709>',
  endFilled: '<:progress_end_filled:1084261100226355350>',
  endEmpty: '<:progress_end_empty:1084261097550381118>',
  startFilled: '<:progress_start_filled:1084261095516164177>',
  startEmpty: '<:progress_start_empty:1084261098783506472>'
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

  const progress = player.position / (track.length ?? player.position)
  const filledCount = Math.floor(progress * 10)
  const halfCount = Math.round((0.4 % 0.1) * 10)
  const emptyCount = 10 - filledCount - halfCount

  const progressBarText = `${
    filledCount || halfCount ? progressEmojis.startFilled : progressEmojis.startEmpty
  }${progressEmojis.mid1.repeat(filledCount)}${progressEmojis.mid05.repeat(halfCount)}${progressEmojis.mid0.repeat(
    emptyCount
  )}${filledCount === 10 ? progressEmojis.endFilled : progressEmojis.endEmpty}`

  return {
    embeds: [
      new EmbedBuilder()
        .setColor(0x5181b8)
        .setAuthor({
          name: `Сейчас играет ${Utils.escapeFormat(track.author)} — ${Utils.escapeFormat(track.title)}.`,
          iconURL: track.thumbnail
        })
        .setDescription(`${Utils.formatTime(player.position)}/${Utils.formatTime(track.length ?? 0)}${progressBarText}`)
    ],
    components: [row]
  }
}
