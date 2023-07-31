import { SlashCommandBuilder } from 'discord.js'
import Utils, { ErrorMessageType } from '../../utils.js'
import { CommandCustomInteraction } from '../commandInteractions.js'

export const interaction: CommandCustomInteraction = {
  name: 'leave',
  djOnly: true,
  cooldown: 1,
  data: new SlashCommandBuilder()
    .setName('leave')
    .setDescription('Выход из голосового канала')
    .setDMPermission(false),
  execute: async ({ client, respond, guild, voice }) => {
    const player = client.playerManager.get(guild.id)

    if (!Utils.checkPlayer(respond, player)) return
    if (!Utils.checkSameVoiceChannel(respond, voice)) return

    Utils.clearExitTimeout(guild.id, client)

    await player.safeDestroy()

    await respond({
      embeds: [Utils.generateErrorMessage('👋', ErrorMessageType.NoTitle)]
    })
  }
}
