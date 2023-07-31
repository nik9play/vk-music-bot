import { BaseMessageOptions } from 'discord.js'
import { generateQueueResponse } from '../../helpers/queueCommandHelper.js'
import logger from '../../logger.js'
import { ButtonCustomInteraction } from '../buttonInteractions.js'
import Utils from '../../utils.js'

export const interaction: ButtonCustomInteraction = {
  name: 'queue',
  execute: async ({ interaction, client, guild, customAction, meta }) => {
    logger.info({ ...meta }, 'Queue button pressed')

    const page = parseInt(customAction ?? '1')

    if (page) {
      const player = client.playerManager.get(guild.id)

      const respond = async (data: BaseMessageOptions): Promise<void> => {
        try {
          await interaction.update(data)
        } catch {
          logger.error("Can't send edit queue response")
        }
      }

      if (!Utils.checkPlayer(respond, player)) return

      await respond(generateQueueResponse(page, player))
    }
  }
}
