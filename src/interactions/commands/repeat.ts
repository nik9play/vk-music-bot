import { SlashCommandBuilder } from 'discord.js'
import Utils, { ErrorMessageType } from '../../utils.js'
import { CommandCustomInteraction } from '../commandInteractions.js'
import { Repeat } from '../../modules/botPlayer.js'

export const interaction: CommandCustomInteraction = {
  name: 'repeat',
  djOnly: true,
  data: new SlashCommandBuilder()
    .setName('repeat')
    .setDescription('Повтор трека или очереди')
    .addStringOption((option) =>
      option.setName('режим').setDescription('Режим повтора').addChoices(
        {
          name: 'выкл',
          value: 'выкл'
        },
        {
          name: 'трек',
          value: 'трек'
        },
        {
          name: 'очередь',
          value: 'очередь'
        }
      )
    )
    .setDMPermission(false),
  execute: async function ({ guild, voice, client, interaction, respond }) {
    const player = client.playerManager.get(guild.id)

    if (!Utils.checkPlayer(respond, player)) return
    if (!Utils.checkNodeState(respond, player)) return
    if (!Utils.checkSameVoiceChannel(respond, voice)) return

    const repeatParam = interaction.options.getString('режим')

    if (repeatParam) {
      if (repeatParam === 'очередь') {
        player.repeat = Repeat.Queue
        await respond({
          embeds: [
            Utils.generateErrorMessage('🔁 Включен повтор очереди.', ErrorMessageType.NoTitle)
          ]
        })
        return
      }
      if (repeatParam === 'трек') {
        player.repeat = Repeat.Track
        await respond({
          embeds: [Utils.generateErrorMessage('🔁 Включен повтор трека.', ErrorMessageType.NoTitle)]
        })
        return
      }
      if (repeatParam === 'выкл') {
        player.repeat = Repeat.Off
        await respond({
          embeds: [Utils.generateErrorMessage('🔁 Повтор выключен.', ErrorMessageType.NoTitle)]
        })
        return
      }
    }

    let msg
    if (player.repeat === Repeat.Track) msg = 'Повтор текущего трека'
    if (player.repeat === Repeat.Queue) msg = 'Повтор очереди'

    if (msg)
      await respond({
        embeds: [
          Utils.generateErrorMessage(
            `🔁 ${msg} сейчас включен. Доступные режимы: \`очередь\`, \`трек\`, \`выкл\``,
            ErrorMessageType.NoTitle
          )
        ]
      })
    else
      await respond({
        embeds: [
          Utils.generateErrorMessage(
            '🔁 Повтор сейчас выключен. Доступные режимы: `очередь`, `трек`, `выкл`',
            ErrorMessageType.NoTitle
          )
        ]
      })
  }
}
