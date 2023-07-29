import { SlashCommandBuilder } from 'discord.js'
import { getConfig, updateConfig } from '../../db.js'
import Utils, { ErrorMessageType } from '../../utils.js'
import { CommandCustomInteraction } from '../commandInteractions.js'

export const interaction: CommandCustomInteraction = {
  name: '247',
  adminOnly: true,
  premium: true,
  data: new SlashCommandBuilder()
    .setName('247')
    .setDescription('Переключение режима 24/7')
    .setDMPermission(false),
  execute: async function ({ guild, client, respond }) {
    const config = await getConfig(guild.id)

    if (!config.enable247) {
      await updateConfig(guild.id, { enable247: true })
      await respond({
        embeds: [Utils.generateErrorMessage('Режим 24/7 включён.', ErrorMessageType.NoTitle)],
        ephemeral: true
      })

      Utils.clearExitTimeout(guild.id, client)
    } else {
      await updateConfig(guild.id, { enable247: false })
      await respond({
        embeds: [Utils.generateErrorMessage('Режим 24/7 выключен.', ErrorMessageType.NoTitle)],
        ephemeral: true
      })
      const player = client.playerManager.get(guild.id)
      if (player)
        if (player.player.paused || (player.queue.length === 0 && !player.current))
          Utils.setExitTimeout(player, client)
    }
  }
}
