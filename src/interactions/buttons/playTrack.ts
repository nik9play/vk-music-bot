import { playCommandHandler } from '../../helpers/playCommandHelper.js'
import logger from '../../logger.js'
import { ButtonCustomInteraction } from '../buttonInteractions.js'
import { CommandExecuteParams } from '../commandInteractions.js'

export const interaction: ButtonCustomInteraction = {
  name: 'playTrack',
  djOnly: true,
  execute: async ({
    interaction,
    customAction,
    guild,
    voice,
    text,
    user,
    respond,
    send,
    meta,
    client
  }) => {
    const id = customAction
    logger.debug({ id }, 'Button action')
    if (!id) return

    const partialParams: Omit<CommandExecuteParams, 'interaction'> = {
      guild,
      user,
      voice,
      text,
      client,
      respond,
      send,
      meta
    }

    client.userActionsManager.addAction(guild.id, {
      type: 'button',
      memberId: interaction.member.id,
      name: `Добавление трека`
    })

    if (!interaction.deferred) await interaction.deferReply()
    await playCommandHandler(partialParams, id)
  }
}
