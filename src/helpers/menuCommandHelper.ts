import {
  InteractionReplyOptions,
  InteractionUpdateOptions,
  MessageActionRow,
  MessageButton,
  MessageEmbed
} from 'discord.js'
import CustomPlayer from '../kagazumo/CustomPlayer.js'
import Utils from '../utils.js'

export enum MenuButtonType {
  Skip = 'menu_skip',
  Stop = 'menu_stop',
  Queue = 'menu_queue',
  Repeat = 'menu_repeat'
}

export function generateMenuResponse(player?: CustomPlayer): InteractionReplyOptions | InteractionUpdateOptions {
  const embed = new MessageEmbed().setTitle('Меню')

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

  const row1 = new MessageActionRow().addComponents([
    new MessageButton()
      .setCustomId(`menu_pause`)
      .setEmoji(player?.paused ? '<:play_btn:1052960565674393640>' : '<:pause_btn:1052960594065641502>')
      .setStyle('PRIMARY')
      .setDisabled(!player?.queue.current),
    new MessageButton()
      .setCustomId(MenuButtonType.Skip)
      .setEmoji('<:skip:1052960924996223037>')
      .setStyle('PRIMARY')
      .setDisabled(!player?.queue.current),
    new MessageButton()
      .setCustomId(MenuButtonType.Stop)
      .setEmoji('<:stop_btn:1052960619940302868>')
      .setStyle('PRIMARY')
      .setDisabled(!player?.queue.current),
    new MessageButton()
      .setCustomId(MenuButtonType.Queue)
      .setEmoji('<:queue:1052960903047426099>')
      .setStyle('PRIMARY')
      .setDisabled(!player?.queue),
    //new MessageButton().setCustomId('menu_update').setEmoji('🔃').setStyle('PRIMARY'),
    new MessageButton()
      .setCustomId(MenuButtonType.Repeat)
      .setEmoji(repeatEmojis[player?.loop ?? 'none'])
      .setStyle('PRIMARY')
  ])

  console.log(player?.loop)
  console.log(repeatEmojis[player?.loop ?? 'none'])

  // const row2 = new MessageActionRow().addComponents([
  //   new MessageButton()
  //     .setCustomId(`menu_pause`)
  //     .setEmoji(player?.paused ? '▶️' : '⏸️')
  //     .setStyle('PRIMARY')
  //     .setDisabled(!player?.playing),
  //   new MessageButton().setCustomId('menu_skip').setEmoji('⏩').setStyle('PRIMARY').setDisabled(!player?.queue.current),
  //   new MessageButton().setCustomId('menu_stop').setEmoji('⏹️').setStyle('PRIMARY').setDisabled(!player?.queue.current),
  //   new MessageButton().setCustomId('menu_queue').setEmoji('📃').setStyle('PRIMARY').setDisabled(!player?.queue),
  //   new MessageButton().setCustomId('menu_update').setEmoji('🔃').setStyle('PRIMARY')
  // ])

  const components = [row1]

  return { embeds: [embed], components }
}
