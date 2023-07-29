import { SlashCommandBuilder } from 'discord.js'
import Utils, { ErrorMessageType } from '../../utils.js'
import { CommandCustomInteraction } from '../commandInteractions.js'

export const interaction: CommandCustomInteraction = {
  name: 'volume',
  djOnly: true,
  premium: true,
  dev: true,
  data: new SlashCommandBuilder()
    .setName('volume')
    .setDescription('Установить громкость бота (в процентах)')
    .addIntegerOption((option) =>
      option
        .setName('громкость')
        .setDescription('Громкость в процентах')
        .setRequired(true)
        .setMinValue(1)
        .setMaxValue(100)
    )
    .setDMPermission(false),
  cooldown: 1,
  execute: async ({ client, guild, respond, voice, interaction }) => {
    const player = client.playerManager.get(guild.id)
    if (!player) {
      await Utils.sendNoPlayerMessage(respond)
      return
    }

    if (!voice) {
      await Utils.sendNoVoiceChannelMessage(respond)
      return
    }

    await Utils.checkNodeState(player, respond)

    let volume = interaction.options.getInteger('уровень', true)

    if (volume > 100) volume = 100
    if (volume < 1) volume = 1

    await player.player.setVolume(volume / 100.0)

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
