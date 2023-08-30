import { generatePlayerStartMessage } from '../../helpers/playerStartHelper.js'
import { ButtonCustomInteraction } from '../buttonInteractions.js'

export const interaction: ButtonCustomInteraction = {
  name: 'volume',
  djOnly: true,
  premium: true,
  execute: async ({ interaction, client, guild, customAction }) => {
    const player = client.playerManager.get(guild.id)

    if (!player) {
      if (interaction.message.deletable) await interaction.message.delete().catch(() => {})
      return
    }

    const offset = player.volume >= 150 ? 50 : 10
    let newVolume =
      Math.round((player.volume + offset * (customAction === '+' ? 1 : -1)) / offset) * offset
    if (newVolume <= 0) newVolume = 1

    await player.setVolume(newVolume)

    if (player.current) {
      await interaction.update(await generatePlayerStartMessage(player, player.current))
      return
    }
  }
}
