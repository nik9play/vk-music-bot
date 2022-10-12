import { Command } from '../SlashCommandManager'
import Utils, { ErrorMessageType } from '../Utils'

export default new Command({
  name: 'pause',
  aliases: ['ps', 'resume'],
  djOnly: true,
  premium: false,
  adminOnly: false,
  execute: async ({ guild, voice, client, respond }) => {
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

    if (player.paused) {
      const timer = client.timers.get(guild.id)
      if (timer) clearTimeout(timer)

      await respond({
        embeds: [
          Utils.generateErrorMessage(
            '▶️ Пауза снята.',
            ErrorMessageType.NoTitle
          )
        ]
      })

      player.pause(false)
      return
    }

    if (!(await client.db.get247(guild.id)))
      client.timers.set(guild.id, Utils.getExitTimeout(player, client))

    await respond({
      embeds: [
        Utils.generateErrorMessage(
          '⏸️ Пауза поставлена.',
          ErrorMessageType.NoTitle
        )
      ]
    })

    player.pause(true)
    return
  }
})
