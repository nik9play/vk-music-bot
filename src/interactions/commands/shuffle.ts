import { SlashCommandBuilder } from 'discord.js'
import Utils, { ErrorMessageType } from '../../utils.js'
import { CommandCustomInteraction } from '../commandInteractions.js'

export const interaction: CommandCustomInteraction = {
  name: 'shuffle',
  aliases: ['sh'],
  djOnly: true,
  premium: true,
  cooldown: 3,
  data: new SlashCommandBuilder()
    .setName('shuffle')
    .setDescription('Перемешивание текущей очереди')
    .setDMPermission(false),
  execute: async function ({ guild, voice, client, respond }) {
    const player = client.playerManager.get(guild.id)

    if (!Utils.checkPlayer(respond, player)) return
    if (!Utils.checkQueue(respond, player)) return
    if (!Utils.checkNodeState(respond, player)) return
    if (!Utils.checkSameVoiceChannel(respond, voice)) return

    player.shuffle()

    await respond({
      embeds: [Utils.generateErrorMessage('🔀 Очередь перемешана.', ErrorMessageType.NoTitle)]
    })
  }
}
