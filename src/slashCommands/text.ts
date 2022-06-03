import { Command } from '../SlashCommandManager'
import Utils, { ErrorMessageType } from '../Utils'
import logger from '../Logger'

export default new Command({
  name: 'text',
  djOnly: true,
  adminOnly: false,
  premium: false,
  cooldown: 1,
  execute: async ({ client, guild, respond, voice, text, args }) => {
    const player = client.manager.get(guild.id)
    if (!player) return respond({ embeds: [Utils.generateErrorMessage('Сейчас ничего не играет.')], ephemeral: true })

    if (!voice) return respond({
      embeds: [Utils.generateErrorMessage('Необходимо находиться в голосовом канале.')],
      ephemeral: true
    })
    //if (channel.id !== player.voiceChannel) return message.reply("вы находитесь не в том голосовом канале.")

    logger.info(args)

    let textChannel = text

    if (args[0]) {
      if (args[0].startsWith('<#')) {
        const channel = client.channels.cache.get(args[0].slice(2,-1))

        if (channel?.isText()) {
          if (channel.type === 'GUILD_TEXT' && channel.guild.id === guild.id) {
            textChannel = channel
          } else {
            await respond({ embeds: [Utils.generateErrorMessage('Необходимо указать текстовый канал.', ErrorMessageType.Error)] })
            return
          }
        } else {
          await respond({ embeds: [Utils.generateErrorMessage('Не удалось найти такой канал', ErrorMessageType.Error)] })
          return
        }
      }
    }

    player.setTextChannel(textChannel.id)

    await respond({ embeds: [Utils.generateErrorMessage(`Для уведомлений установлен текстовый канал <#${textChannel.id}>`, ErrorMessageType.NoTitle)] })
  }
})