import { ChatInputCommandInteraction } from 'discord.js'
import { playCommandHandler } from '../../helpers/playCommandHelper.js'
import { ButtonCustomInteraction } from '../buttonInteractions.js'
import { CommandExecuteParams } from '../commandInteractions.js'

//todo: проверить работу с fetch
export const interaction: ButtonCustomInteraction = {
  name: 'playTrack',
  execute: async ({ interaction, customAction, guild, voice, text, user, respond, send, meta, client }) => {
    const id = customAction
    if (!id) return

    const partialParams: CommandExecuteParams = {
      interaction: {} as ChatInputCommandInteraction<'cached'>,
      guild,
      user,
      voice,
      text,
      client,
      respond,
      send,
      meta
    }
    await interaction.deferReply()
    await playCommandHandler(partialParams, id)
  }
}
