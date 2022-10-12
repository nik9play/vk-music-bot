import { Command } from '../SlashCommandManager'
import Utils, { ErrorMessageType } from '../Utils'

const levelTypes = ['выкл', 'слабый', 'средний', 'мощный']

export default new Command({
  name: 'bass',
  premium: true,
  adminOnly: false,
  djOnly: true,
  execute: async function ({ respond, client, guild, voice, interaction }) {
    const player = client.manager.get(guild.id)
    if (!player) {
      await respond({
        embeds: [Utils.generateErrorMessage('Сейчас ничего не играет.')],
        ephemeral: true
      })
      return
    }

    if (!voice) {
      await respond({
        embeds: [
          Utils.generateErrorMessage(
            'Необходимо находиться в голосовом канале.'
          )
        ],
        ephemeral: true
      })
      return
    }

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

      player.setEQ(...bands)

      await respond({
        embeds: [
          Utils.generateErrorMessage(
            `🔈 Уровень бас буста выставлен на \`${level}\`.\nДоступные уровни: \`выкл\`, \`слабый\`, \`средний\`, \`мощный\``,
            ErrorMessageType.NoTitle
          )
        ]
      })
    } else {
      await respond({
        embeds: [
          Utils.generateErrorMessage(
            '🔈 Доступные уровни: `выкл`, `слабый`, `средний`, `мощный`'
          )
        ]
      })
    }
  }
})
