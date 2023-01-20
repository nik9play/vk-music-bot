import CustomPlayer from '../kagazumo/CustomPlayer.js'
import { Command } from '../slashCommandManager.js'
import Utils, { ErrorMessageType } from '../utils.js'

export default new Command({
  name: 'text',
  djOnly: true,
  adminOnly: false,
  premium: false,
  cooldown: 1,
  execute: async ({ client, guild, respond, voice, text, interaction }) => {
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

    let textChannel = text
    const channelParam = interaction.options.getChannel('канал')

    if (channelParam) {
      if (
        channelParam.type !== 'GUILD_TEXT' &&
        channelParam.type !== 'GUILD_VOICE' &&
        channelParam.type !== 'GUILD_PUBLIC_THREAD' &&
        channelParam.type !== 'GUILD_PRIVATE_THREAD'
      ) {
        await respond({
          embeds: [Utils.generateErrorMessage('Тип канала не подходит.', ErrorMessageType.Error)]
        })
        return
      }

      if (channelParam.isText()) {
        if (channelParam.guild.id === guild.id) {
          textChannel = channelParam
        } else {
          await respond({
            embeds: [Utils.generateErrorMessage('Необходимо указать текстовый канал.', ErrorMessageType.Error)]
          })
          return
        }
      } else {
        await respond({
          embeds: [Utils.generateErrorMessage('Не удалось найти такой канал.', ErrorMessageType.Error)]
        })
        return
      }
    }

    player.setTextChannel(textChannel.id)

    await respond({
      embeds: [
        Utils.generateErrorMessage(
          `Для уведомлений установлен текстовый канал <#${textChannel.id}>`,
          ErrorMessageType.NoTitle
        )
      ]
    })
  }
})
