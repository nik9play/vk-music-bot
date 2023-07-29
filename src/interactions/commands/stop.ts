import { SlashCommandBuilder } from 'discord.js'
import Utils, { ErrorMessageType } from '../../utils.js'
import { CommandCustomInteraction } from '../commandInteractions.js'

export const interaction: CommandCustomInteraction = {
  name: 'stop',
  djOnly: true,
  cooldown: 1,
  data: new SlashCommandBuilder()
    .setName('stop')
    .setDescription('Очистка очереди и остановка воспроизведения')
    .setDMPermission(false),
  execute: async ({ client, guild, respond, voice }) => {
    const player = client.playerManager.get(guild.id)
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
          Utils.generateErrorMessage(
            '⏹️ Воспроизведение остановлено и очередь очищена.',
            ErrorMessageType.NoTitle
          )
        ]
      },
      20000
    )
  }
}
