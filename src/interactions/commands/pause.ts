import { SlashCommandBuilder } from 'discord.js'
import { getConfig } from '../../db.js'
import Utils, { ErrorMessageType } from '../../utils.js'
import { CommandCustomInteraction } from '../commandInteractions.js'

export const interaction: CommandCustomInteraction = {
  name: 'pause',
  djOnly: true,
  data: new SlashCommandBuilder()
    .setName('pause')
    .setDescription('Пауза/снятие с паузы')
    .setDMPermission(false),
  execute: async ({ guild, voice, client, respond }) => {
    const player = client.playerManager.get(guild.id)

    if (!Utils.checkPlayer(respond, player)) return
    if (!Utils.checkPlaying(respond, player.current)) return
    if (!Utils.checkNodeState(respond, player)) return
    if (!Utils.checkSameVoiceChannel(respond, voice)) return

    //if (channel.id !== player.voiceChannel) return message.reply("вы находитесь не в том голосовом канале.")

    if (player.player.paused) {
      Utils.clearExitTimeout(guild.id, client)

      await player.player.setPaused(false)

      await respond({
        embeds: [Utils.generateErrorMessage('▶️ Пауза снята.', ErrorMessageType.NoTitle)]
      })

      return
    }

    const config = await getConfig(guild.id)

    if (!config.enable247) Utils.setExitTimeout(player, client)

    await player.player.setPaused(true)

    await respond({
      embeds: [Utils.generateErrorMessage('⏸️ Пауза поставлена.', ErrorMessageType.NoTitle)]
    })

    return
  }
}
