import Utils from '../utils.js'
import CustomPlayer from '../kazagumo/CustomPlayer.js'
import { Command } from '../slashCommandManager.js'

export default new Command({
  name: 'skip',
  aliases: ['n'],
  djOnly: true,
  adminOnly: false,
  premium: false,
  cooldown: 1,
  execute: async ({ client, guild, voice, respond, interaction }) => {
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

    if (!player.queue.current) {
      await respond({
        embeds: [Utils.generateErrorMessage('Очередь пуста.')],
        ephemeral: true
      })
      return
    }

    const { title, author } = player.queue.current

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

    player.pause(false)
    player.skip(skipCount)

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
})
