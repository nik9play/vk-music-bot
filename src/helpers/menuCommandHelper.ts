import {
  InteractionReplyOptions,
  InteractionUpdateOptions,
  ActionRowBuilder,
  ButtonBuilder,
  EmbedBuilder,
  ButtonStyle
} from 'discord.js'
import CustomPlayer from '../kazagumo/CustomPlayer.js'
import Utils from '../utils.js'

export enum MenuButtonType {
  Skip = 'skip',
  Stop = 'stop',
  Queue = 'queue',
  Repeat = 'repeat',
  Pause = 'pause'
}

export function generateMenuResponse(player?: CustomPlayer): InteractionReplyOptions | InteractionUpdateOptions {
  const embed = new EmbedBuilder().setTitle('Меню')

  if (player) {
    embed.setDescription(
      `В очереди сейчас ${player.queue.size} ${Utils.declOfNum(player.queue.size, ['трек', 'трека', 'треков'])}.`
    )

    if (player.queue.current)
      embed.addFields([
        {
          name: 'Сейчас играет',
          value: `${player.queue.current.author} — ${player.queue.current.title} (${Utils.formatTime(
            player.position
          )}/${Utils.formatTime(player.queue.current.length ?? 0)})`
        }
      ])
    else
      embed.addFields([
        {
          name: 'Сейчас играет',
          value: 'Ничего'
        }
      ])

    embed.addFields([
      {
        name: 'Состояние плеера',
        value: !player.paused && player.queue.current ? '▶️' : player.paused ? '⏸️' : '⏹️'
      }
    ])
  } else {
    embed.setDescription(`Очередь пуста.`)
  }

  const repeatEmojis = {
    none: '<:repeat_no:1052960708641431642>',
    queue: '<:repeat_queue:1052960645907226704>',
    track: '<:repeat_one_btn:1052960682666102815>'
  }

  const row1 = new ActionRowBuilder<ButtonBuilder>().addComponents([
    new ButtonBuilder()
      .setCustomId('menu_' + MenuButtonType.Pause)
      .setEmoji(player?.paused ? '<:play_btn:1052960565674393640>' : '<:pause_btn:1052960594065641502>')
      .setStyle(ButtonStyle.Primary)
      .setDisabled(!player?.queue.current),
    new ButtonBuilder()
      .setCustomId('menu_' + MenuButtonType.Skip)
      .setEmoji('<:skip:1052960924996223037>')
      .setStyle(ButtonStyle.Primary)
      .setDisabled(!player?.queue.current),
    new ButtonBuilder()
      .setCustomId('menu_' + MenuButtonType.Stop)
      .setEmoji('<:stop_btn:1052960619940302868>')
      .setStyle(ButtonStyle.Primary)
      .setDisabled(!player?.queue.current),
    new ButtonBuilder()
      .setCustomId('menu_' + MenuButtonType.Queue)
      .setEmoji('<:queue:1052960903047426099>')
      .setStyle(ButtonStyle.Primary)
      .setDisabled(!player?.queue),
    //new MessageButton().setCustomId('menu_update').setEmoji('🔃').setStyle(ButtonStyle.Primary),
    new ButtonBuilder()
      .setCustomId('menu_' + MenuButtonType.Repeat)
      .setEmoji(repeatEmojis[player?.loop ?? 'none'])
      .setStyle(ButtonStyle.Primary)
  ])

  console.log(player?.loop)
  console.log(repeatEmojis[player?.loop ?? 'none'])

  // const row2 = new MessageActionRow().addComponents([
  //   new MessageButton()
  //     .setCustomId(`menu_pause`)
  //     .setEmoji(player?.paused ? '▶️' : '⏸️')
  //     .setStyle(ButtonStyle.Primary)
  //     .setDisabled(!player?.playing),
  //   new MessageButton().setCustomId('menu_skip').setEmoji('⏩').setStyle(ButtonStyle.Primary).setDisabled(!player?.queue.current),
  //   new MessageButton().setCustomId('menu_stop').setEmoji('⏹️').setStyle(ButtonStyle.Primary).setDisabled(!player?.queue.current),
  //   new MessageButton().setCustomId('menu_queue').setEmoji('📃').setStyle(ButtonStyle.Primary).setDisabled(!player?.queue),
  //   new MessageButton().setCustomId('menu_update').setEmoji('🔃').setStyle(ButtonStyle.Primary)
  // ])

  const components = [row1]

  return { embeds: [embed], components }
}
