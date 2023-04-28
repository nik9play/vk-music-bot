import { getConfig } from '../../db.js'
import Utils, { ErrorMessageType } from '../../utils.js'
import { CommandCustomInteraction } from '../commandInteractions.js'

export const interaction: CommandCustomInteraction = {
  name: 'pause',
  aliases: ['ps', 'resume'],
  djOnly: true,
  premium: false,
  adminOnly: false,
  execute: async ({ guild, voice, client, respond }) => {
    const player = client.playerManager.get(guild.id)
    if (!player) {
      await Utils.sendNoPlayerMessage(respond)
      return
    }

    if (!voice) {
      await Utils.sendNoVoiceChannelMessage(respond)
      return
    }

    await Utils.checkNodeState(player, respond)

    //if (channel.id !== player.voiceChannel) return message.reply("вы находитесь не в том голосовом канале.")

    if (player.player.paused) {
      Utils.clearExitTimeout(guild.id, client)

      await respond({
        embeds: [Utils.generateErrorMessage('▶️ Пауза снята.', ErrorMessageType.NoTitle)]
      })

      player.player.setPaused(false)
      return
    }

    const config = await getConfig(guild.id)

    if (!config.enable247) Utils.setExitTimeout(player, client)

    await respond({
      embeds: [Utils.generateErrorMessage('⏸️ Пауза поставлена.', ErrorMessageType.NoTitle)]
    })

    player.player.setPaused(true)
    return
  }
}
