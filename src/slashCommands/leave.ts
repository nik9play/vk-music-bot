import CustomPlayer from '../kazagumo/CustomPlayer.js'
import { Command } from '../slashCommandManager.js'
import Utils, { ErrorMessageType } from '../utils.js'

export default new Command({
  name: 'leave',
  djOnly: true,
  cooldown: 1,
  adminOnly: false,
  premium: false,
  execute: async ({ client, respond, guild, voice }) => {
    const player = client.kazagumo.getPlayer<CustomPlayer>(guild.id)
    if (!player) {
      await respond({
        embeds: [Utils.generateErrorMessage('Сейчас ничего не играет.')],
        ephemeral: true
      })
      return
    }

    if (!voice) {
      await respond({
        embeds: [Utils.generateErrorMessage('Необходимо находиться в голосовом канале.')],
        ephemeral: true
      })
      return
    }
    //if (channel.id !== player.voiceChannel) return message.reply("вы находитесь не в том голосовом канале.")

    const timer = client.timers.get(guild.id)
    if (timer) clearTimeout(timer)

    player.destroy()

    await respond({
      embeds: [Utils.generateErrorMessage('👋', ErrorMessageType.NoTitle)]
    })
  }
})
