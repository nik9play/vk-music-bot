import { Command } from '../modules/slashCommandManager.js'
import Utils, { ErrorMessageType } from '../utils.js'

export default new Command({
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
})
