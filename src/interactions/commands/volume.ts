import { SlashCommandBuilder } from 'discord.js'
import Utils, { ErrorMessageType } from '../../utils.js'
import { CommandCustomInteraction } from '../commandInteractions.js'

export const interaction: CommandCustomInteraction = {
  name: 'volume',
  djOnly: true,
  premium: true,
  dev: false,
  data: new SlashCommandBuilder()
    .setName('volume')
    .setDescription('Установить громкость бота (в процентах)')
    .addIntegerOption((option) =>
      option
        .setName('уровень')
        .setDescription('Громкость в процентах (0-1000)')
        .setRequired(true)
        .setMinValue(1)
        .setMaxValue(1000)
    )
    .setDMPermission(false),
  cooldown: 1,
  execute: async ({ client, guild, respond, voice, interaction }) => {
    const player = client.playerManager.get(guild.id)

    if (!Utils.checkPlayer(respond, player)) return
    if (!Utils.checkPlaying(respond, player.current)) return
    if (!Utils.checkNodeState(respond, player)) return
    if (!Utils.checkSameVoiceChannel(respond, voice)) return

    const volume = interaction.options.getInteger('уровень', true)

    await player.setVolume(volume)

    await respond(
      {
        embeds: [
          Utils.generateErrorMessage(
            `🔊 Уровень громкости установлен на **${volume}%**.`,
            ErrorMessageType.NoTitle
          )
        ]
      },
      20_000
    )
  }
}
