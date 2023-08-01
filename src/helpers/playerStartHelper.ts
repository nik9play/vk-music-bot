import {
  ActionRowBuilder,
  ButtonBuilder,
  ButtonStyle,
  DiscordAPIError,
  EmbedBuilder,
  InteractionReplyOptions,
  InteractionUpdateOptions
} from 'discord.js'

import Utils, { Emojis } from '../utils.js'
import { VkMusicBotClient } from '../client.js'
import logger from '../logger.js'
import BotPlayer from '../modules/botPlayer.js'
import BotTrack from '../structures/botTrack.js'
import BaseLoader from '../loaders/baseLoader.js'

export enum MenuButtonType {
  Skip = 'skip',
  Stop = 'stop',
  Queue = 'queue',
  Repeat = 'repeat',
  Pause = 'pause',
  Leave = 'leave'
}

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

export function generatePlayerStartMessage(
  player: BotPlayer,
  track: BotTrack
): InteractionReplyOptions & InteractionUpdateOptions {
  const row = new ActionRowBuilder<ButtonBuilder>().addComponents([
    new ButtonBuilder()
      .setCustomId(`menu,${MenuButtonType.Pause}`)
      .setEmoji(player.player.paused ? Emojis.Play : Emojis.Pause)
      .setStyle(player.player.paused ? ButtonStyle.Primary : ButtonStyle.Secondary)
      .setDisabled(!player.current),
    new ButtonBuilder()
      .setCustomId(`menu,${MenuButtonType.Skip}`)
      .setEmoji(Emojis.Skip)
      .setStyle(ButtonStyle.Secondary)
      .setDisabled(!player.current),
    new ButtonBuilder()
      .setCustomId(`menu,${MenuButtonType.Stop}`)
      .setEmoji(Emojis.Stop)
      .setStyle(ButtonStyle.Secondary)
      .setDisabled(!player.current),
    new ButtonBuilder()
      .setCustomId(`menu,${MenuButtonType.Queue}`)
      .setEmoji(Emojis.Queue)
      .setStyle(ButtonStyle.Secondary),
    //.setDisabled(!player.queue),
    //new MessageButton().setCustomId('menu_update').setEmoji('🔃').setStyle(ButtonStyle.Primary),
    new ButtonBuilder()
      .setCustomId(`menu,${MenuButtonType.Repeat}`)
      .setEmoji(repeatEmojis[player.repeat ?? 'none'])
      .setStyle(player.repeat === 'none' ? ButtonStyle.Secondary : ButtonStyle.Primary)
  ])

  const row2 = new ActionRowBuilder<ButtonBuilder>().addComponents([
    new ButtonBuilder()
      .setCustomId('openTrackRequestModal')
      .setStyle(ButtonStyle.Success)
      .setEmoji(Emojis.Add),
    new ButtonBuilder()
      .setDisabled(true)
      .setCustomId('empty_btn1')
      .setStyle(ButtonStyle.Secondary)
      .setLabel('\u2800'),
    new ButtonBuilder()
      .setDisabled(true)
      .setCustomId('empty_btn2')
      .setStyle(ButtonStyle.Secondary)
      .setLabel('\u2800'),
    new ButtonBuilder()
      .setDisabled(true)
      .setCustomId('empty_btn3')
      .setStyle(ButtonStyle.Secondary)
      .setLabel('\u2800'),
    new ButtonBuilder()
      .setCustomId(`menu,${MenuButtonType.Leave}`)
      .setEmoji(Emojis.Leave)
      .setStyle(ButtonStyle.Danger)
  ])

  const duration = track.duration ?? player.player.position
  const fixedDuration = duration < player.player.position ? player.player.position : duration
  const progress = player.player.position / fixedDuration
  const filledCount = Math.floor(progress * 10)
  const halfCount = Math.round((0.4 % 0.1) * 10)
  const emptyCount = 10 - filledCount - halfCount

  const progressBarText = `${
    filledCount || halfCount ? progressEmojis.startFilled : progressEmojis.startEmpty
  }${progressEmojis.mid1.repeat(filledCount)}${progressEmojis.mid05.repeat(
    halfCount
  )}${progressEmojis.mid0.repeat(emptyCount)}${
    filledCount === 10 ? progressEmojis.endFilled : progressEmojis.endEmpty
  }`

  const loader = player.client.loaders.get(track.sourceNameCode) as BaseLoader

  return {
    embeds: [
      new EmbedBuilder()
        .setColor(loader?.color)
        .setAuthor({
          name: 'Сейчас играет'
        })
        .setTitle(Utils.escapeFormat(track.title).slice(0, 100))
        // .setAuthor({
        //   name: `Сейчас играет ${Utils.escapeFormat(track.author).slice(0, 100)} — ${Utils.escapeFormat(
        //     track.title
        //   ).slice(0, 100)}.`,
        //   iconURL: track.thumb
        // })
        .setThumbnail(track.thumb ?? null)
        .setDescription(
          `${Utils.escapeFormat(track.author).slice(0, 100)}\n\n` +
            `${Utils.formatTime(player.player.position)} ${progressBarText} ${Utils.formatTime(
              fixedDuration
            )}`
        )

        .setFooter({
          text: loader.displayName,
          iconURL: loader.iconURL
        })
        .setURL(track.uri ?? null)
    ],
    components: [row, row2]
  }
}

export async function deletePreviousTrackStartMessage(client: VkMusicBotClient, guildId: string) {
  const previousMessage = client.latestMenus.get(guildId)

  if (previousMessage?.deletable) {
    await previousMessage
      .delete()
      .catch((err: DiscordAPIError) => {
        if (err.code === 10008) {
          logger.debug('The previous message was not found.')
          return
        }
        logger.error({ err: err.message }, "Can't delete the previous message")
      })
      .finally(() => {
        // client.latestMenus.delete(player.guildId)
        // logger.debug('delete pr track msg')
      })
  }
}
