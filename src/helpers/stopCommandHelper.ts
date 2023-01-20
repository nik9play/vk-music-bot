import CustomPlayer from '../kagazumo/CustomPlayer.js'
import { CommandExecuteParams } from '../slashCommandManager.js'
import Utils, { ErrorMessageType } from '../utils.js'

export async function stopCommand(params: Pick<CommandExecuteParams, 'client' | 'guild' | 'respond' | 'voice'>) {
  const { client, guild, respond, voice } = params

  const player = client.kagazumo.getPlayer<CustomPlayer>(guild.id)
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

  player.setLoop('none')
  player.queue.clear()
  player.skip()

  await respond(
    {
      embeds: [
        Utils.generateErrorMessage('⏹️ Воспроизведение остановлено и очередь очищена.', ErrorMessageType.NoTitle)
      ]
    },
    20000
  )
}
