import { SlashCommandBuilder } from 'discord.js'
import Utils, { ErrorMessageType } from '../../utils.js'
import { CommandCustomInteraction } from '../commandInteractions.js'

export const interaction: CommandCustomInteraction = {
  name: 'fix',
  djOnly: true,
  cooldown: 5,
  data: new SlashCommandBuilder()
    .setName('fix')
    .setDescription('Исправляет бота, если что-то пошло не так')
    .setDMPermission(false),
  execute: async ({ client, respond, guild }) => {
    const player = client.playerManager.get(guild.id)

    Utils.clearExitTimeout(guild.id, client)

    await player?.safeDestroy()

    Utils.forceLeave(guild)

    await respond({
      embeds: [Utils.generateErrorMessage('🔧', ErrorMessageType.NoTitle)]
    })
  }
}
