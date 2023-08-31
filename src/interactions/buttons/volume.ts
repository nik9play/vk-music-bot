import { generatePlayerStartMessage } from '../../helpers/playerStartHelper.js'
import Utils from '../../utils.js'
import { ButtonCustomInteraction } from '../buttonInteractions.js'

export const interaction: ButtonCustomInteraction = {
  name: 'volume',
  djOnly: true,
  premium: true,
  execute: async ({ interaction, client, guild, customAction, respond, voice }) => {
    const player = client.playerManager.get(guild.id)

    if (!player || !Utils.checkPlayer(respond, player)) {
      if (interaction.message.deletable) await interaction.message.delete().catch(() => {})
      return
    }

    if (!Utils.checkNodeState(respond, player) || !Utils.checkSameVoiceChannel(respond, voice)) {
      return
    }

    const offset = player.volume >= 150 ? 50 : 10
    let newVolume =
      Math.round((player.volume + offset * (customAction === '+' ? 1 : -1)) / offset) * offset
    if (newVolume <= 0) newVolume = 1

    await player.setVolume(newVolume)

    if (player.current) {
      await interaction.update(await generatePlayerStartMessage(player, player.current))
    }

    client.userActionsManager.addAction(guild.id, {
      type: 'button',
      memberId: interaction.member.id,
      name: `Громкость ${customAction === '+' ? 'вверх' : 'вниз'}`
    })
  }
}
