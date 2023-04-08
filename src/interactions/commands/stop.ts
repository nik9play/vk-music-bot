import Utils, { ErrorMessageType } from '../../utils.js'
import { CommandCustomInteraction } from '../commandInteractions.js'

export const interaction: CommandCustomInteraction = {
  name: 'stop',
  aliases: ['s'],
  djOnly: true,
  adminOnly: false,
  premium: false,
  cooldown: 1,
  execute: async ({ client, guild, respond, voice }) => {
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

    await Utils.checkNodeState(player, respond)

    await player.stop()

    await respond(
      {
        embeds: [
          Utils.generateErrorMessage('⏹️ Воспроизведение остановлено и очередь очищена.', ErrorMessageType.NoTitle)
        ]
      },
      20000
    )
  }
}
