import { SlashCommandBuilder } from 'discord.js'
import Utils from '../../utils.js'
import { CommandCustomInteraction } from '../commandInteractions.js'

export const interaction: CommandCustomInteraction = {
  name: 'skip',
  aliases: ['n'],
  djOnly: true,
  cooldown: 1,
  data: new SlashCommandBuilder()
    .setName('skip')
    .setDescription('Пропуск текущего трека')
    .addIntegerOption((option) =>
      option.setName('количество').setDescription('Количество треков для пропуска')
    )
    .setDMPermission(false),
  execute: async ({ client, guild, voice, respond, interaction }) => {
    const player = client.playerManager.get(guild.id)

    if (!Utils.checkPlayer(respond, player)) return
    if (!Utils.checkPlaying(respond, player.current)) return
    if (!Utils.checkNodeState(respond, player)) return
    if (!Utils.checkSameVoiceChannel(respond, voice)) return

    const { title, author } = player.current

    let skipCount = interaction.options.getInteger('количество')
    if (!skipCount || skipCount < 1) skipCount = 1

    let description = `**${Utils.escapeFormat(author)} — ${Utils.escapeFormat(title)}** пропущен.`

    if (skipCount > 1)
      description = `**${Utils.escapeFormat(author)} — ${Utils.escapeFormat(title)}** и еще ${
        skipCount - 1
      } ${Utils.declOfNum(skipCount - 1, ['трек', 'трека', 'треков'])} пропущены.`

    // if (skipCount > player.queue.totalSize) {
    //   await respond(
    //     {
    //       embeds: [Utils.generateErrorMessage('Нельзя пропустить количество треков большее чем размер очереди.')]
    //     },
    //     20000
    //   )
    //   return
    // }

    await player.skip(skipCount)

    await respond(
      {
        embeds: [
          {
            description: description,
            color: 0x5181b8
          }
        ]
      },
      20000
    )
    return
  }
}
