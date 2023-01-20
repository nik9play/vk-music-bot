import CustomPlayer from '../kagazumo/CustomPlayer.js'
import { Command } from '../slashCommandManager.js'
import Utils, { ErrorMessageType } from '../utils.js'

export default new Command({
  name: 'fix',
  djOnly: true,
  cooldown: 5,
  adminOnly: false,
  premium: false,
  execute: async ({ client, respond, guild }) => {
    const player = client.kagazumo.getPlayer<CustomPlayer>(guild.id)
    if (!player) return

    const timer = client.timers.get(guild.id)
    if (timer) clearTimeout(timer)

    player.destroy()

    await respond({
      embeds: [Utils.generateErrorMessage('🔧', ErrorMessageType.NoTitle)]
    })
  }
})
