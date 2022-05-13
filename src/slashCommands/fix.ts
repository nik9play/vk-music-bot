import { Command } from '../SlashCommandManager'
import Utils, { ErrorMessageType } from '../Utils'

export default new Command({
  name: 'fix',
  djOnly: true,
  cooldown: 5,
  adminOnly: false,
  premium: false,
  execute: async ({ client, respond, guild }) => {
    const player = client.manager.get(guild.id)
    if (!player)
      return

    const timer = client.timers.get(guild.id)
    if (timer)
      clearTimeout(timer)

    player.destroy()

    await respond({ embeds: [Utils.generateErrorMessage('🔧', ErrorMessageType.NoTitle)] })
  }
})
