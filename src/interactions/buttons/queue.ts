import { InteractionUpdateOptions } from 'discord.js'
import { generateQueueResponse } from '../../helpers/queueCommandHelper.js'
import CustomPlayer from '../../kazagumo/CustomPlayer.js'
import logger from '../../logger.js'
import { ButtonCustomInteraction } from '../../slashCommandManager.js'

const queue: ButtonCustomInteraction = {
  name: 'queue',
  execute: async ({ interaction, client, guild, customAction, meta }) => {
    logger.info({ ...meta }, 'Queue button pressed')

    const page = parseInt(customAction ?? '1')

    if (page) {
      const player = client.kazagumo.getPlayer<CustomPlayer>(guild.id)
      await interaction.update(generateQueueResponse(page, player) as InteractionUpdateOptions)
    }
  }
}

export default queue
