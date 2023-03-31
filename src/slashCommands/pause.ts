import { getConfig } from '../db.js'
import { Command } from '../modules/slashCommandManager.js'
import Utils, { ErrorMessageType } from '../utils.js'

export default new Command({
  name: 'pause',
  aliases: ['ps', 'resume'],
  djOnly: true,
  premium: false,
  adminOnly: false,
  execute: async ({ guild, voice, client, respond }) => {
    const player = client.queue.get(guild.id)
    if (!player) {
      await Utils.sendNoPlayerMessage(respond)
      return
    }

    if (!voice) {
      await Utils.sendNoVoiceChannelMessage(respond)
      return
    }

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
})
