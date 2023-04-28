import { InteractionUpdateOptions } from 'discord.js'
import { generateQueueResponse } from '../../helpers/queueCommandHelper.js'
import logger from '../../logger.js'
import { ButtonCustomInteraction } from '../buttonInteractions.js'

export const interaction: ButtonCustomInteraction = {
  name: 'queue',
  execute: async ({ interaction, client, guild, customAction, meta }) => {
    logger.info({ ...meta }, 'Queue button pressed')

    const page = parseInt(customAction ?? '1')

    if (page) {
      const player = client.playerManager.get(guild.id)
      await interaction.update(generateQueueResponse(page, player) as InteractionUpdateOptions)
    }
  }
}
