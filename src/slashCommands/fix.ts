import {Command} from '../SlashCommandManager'
import Utils, {ErrorMessageType} from '../Utils'

export default new Command({
  name: 'fix',
  djOnly: true,
  cooldown: 5,
  adminOnly: false,
  premium: false,
  execute: async ({client, respond, guild }) => { 
    const player = client.manager.get(guild.id)
    if (!player)
      return

    if (client.timers.has(guild.id))
      clearTimeout(client.timers.get(guild.id))

    player.destroy()
    
    respond({ embeds: [Utils.generateErrorMessage('🔧', ErrorMessageType.NoTitle)] })
  }
})
