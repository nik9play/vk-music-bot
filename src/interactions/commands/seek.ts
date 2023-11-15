import { SlashCommandBuilder } from 'discord.js'
import Utils, { ErrorMessageType } from '../../utils.js'
import { CommandCustomInteraction } from '../commandInteractions.js'

const minSecRegex = /(?<min>\d+):(?<sec>\d+)/

export const interaction: CommandCustomInteraction = {
  name: 'seek',
  djOnly: true,
  premium: false,
  dev: false,
  data: new SlashCommandBuilder()
    .setName('seek')
    .setDescription('Изменить позицию текущего трека')
    .addStringOption((option) =>
      option
        .setName('время')
        .setDescription('Время в формате мин:сек или только секунды')
        .setRequired(true)
    )
    .setDMPermission(false),
  cooldown: 1,
  execute: async ({ client, guild, respond, voice, interaction }) => {
    const player = client.playerManager.get(guild.id)

    if (!Utils.checkPlayer(respond, player)) return
    if (!Utils.checkPlaying(respond, player.current)) return
    if (!Utils.checkNodeState(respond, player)) return
    if (!Utils.checkSameVoiceChannel(respond, voice)) return

    const time = interaction.options.getString('время', true)

    const match = time.match(minSecRegex)

    let ms = -1

    if (match && match.groups) {
      const min = parseInt(match.groups['min'])
      const sec = parseInt(match.groups['sec'])

      ms = min * 60 * 1000 + sec * 1000
    } else if (/\d+/.test(time)) {
      const sec = parseInt(time)

      ms = sec * 1000
    } else {
      await respond(
        {
          embeds: [Utils.generateErrorMessage(`Неверный формат времени.`, ErrorMessageType.Error)]
        },
        20_000
      )

      return
    }

    await player.player.seekTo(ms)

    await respond(
      {
        embeds: [
          Utils.generateErrorMessage(
            `🕑 Трек перемотан на ${Utils.formatTime(ms)}.`,
            ErrorMessageType.NoTitle
          )
        ]
      },
      20_000
    )
  }
}
