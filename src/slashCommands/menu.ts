import { Command } from '../slashCommandManager.js'
import { InteractionReplyOptions } from 'discord.js'
import { generateMenuResponse } from '../helpers/menuCommandHelper.js'
import CustomPlayer from '../kazagumo/CustomPlayer.js'

export default new Command({
  name: 'menu',
  djOnly: true,
  adminOnly: false,
  premium: false,
  execute: async ({ client, guild, respond }) => {
    const player = client.kazagumo.getPlayer<CustomPlayer>(guild.id)

    respond(generateMenuResponse(player) as InteractionReplyOptions)
  }
})
