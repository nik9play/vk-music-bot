import generateErrorMessage from '../tools/generateErrorMessage'

export default {
  name: 'fix',
  djOnly: true,
  cooldown: 5,
  execute: async ({client, respond, guild }) => { 
    const player = client.manager.get(guild.id)
    if (!player)
      return

    if (client.timers.has(guild.id))
      clearTimeout(client.timers.get(guild.id))

    player.destroy()
    
    respond({ embeds: [generateErrorMessage('🔧', 'notitle')] })
  }
}