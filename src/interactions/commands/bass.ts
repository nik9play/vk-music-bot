import { SlashCommandBuilder } from 'discord.js'
import Utils, { ErrorMessageType } from '../../utils.js'
import { CommandCustomInteraction } from '../commandInteractions.js'

const levelTypes = ['выкл', 'слабый', 'средний', 'мощный']

export const interaction: CommandCustomInteraction = {
  name: 'bass',
  premium: true,
  adminOnly: false,
  djOnly: true,
  data: new SlashCommandBuilder()
    .setName('bass')
    .setDescription('Переключение режима усиления басов')
    .addStringOption((option) =>
      option.setName('режим').setDescription('Режим усиления басов').setRequired(true).addChoices(
        {
          name: 'выкл',
          value: 'выкл'
        },
        {
          name: 'слабый',
          value: 'слабый'
        },
        {
          name: 'средний',
          value: 'средний'
        },
        {
          name: 'мощный',
          value: 'мощный'
        }
      )
    )
    .setDMPermission(false),
  execute: async function ({ respond, client, guild, interaction, voice }) {
    const player = client.playerManager.get(guild.id)

    if (!Utils.checkPlayer(respond, player)) return
    if (!Utils.checkPlaying(respond, player.current)) return
    if (!Utils.checkNodeState(respond, player)) return
    if (!Utils.checkSameVoiceChannel(respond, voice)) return
    //if (channel.id !== player.voiceChannel) return message.reply("вы находитесь не в том голосовом канале.")

    const level = interaction.options.getString('режим') as string

    if (levelTypes.includes(level)) {
      let gain = 0.0

      switch (level) {
        case 'выкл':
          gain = 0.0
          break
        case 'слабый':
          gain = 0.15
          break
        case 'средний':
          gain = 0.25
          break
        case 'мощный':
          gain = 0.35
          break
      }

      const bands = new Array(3).fill(null).map((_, i) => ({ band: i, gain }))

      await player.player.setEqualizer(bands)

      await respond({
        embeds: [
          Utils.generateErrorMessage(
            `🔈 Уровень бас буста выставлен на \`${level}\`.\nДоступные уровни: \`выкл\`, \`слабый\`, \`средний\`, \`мощный\`. \nУровень бас буста применится через несколько секунд.`,
            ErrorMessageType.NoTitle
          )
        ]
      })
    } else {
      await respond({
        embeds: [
          Utils.generateErrorMessage('🔈 Доступные уровни: `выкл`, `слабый`, `средний`, `мощный`')
        ]
      })
    }
  }
}
