import { ChannelType } from 'discord.js'
import CustomPlayer from '../kazagumo/CustomPlayer.js'
import { Command } from '../slashCommandManager.js'
import Utils, { ErrorMessageType } from '../utils.js'

export default new Command({
  name: 'text',
  djOnly: true,
  adminOnly: false,
  premium: false,
  cooldown: 1,
  execute: async ({ client, guild, respond, voice, text, interaction }) => {
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

    let textChannelId = text.id

    const channel = interaction.options.getChannel('канал')

    if (channel) {
      if (
        channel.type !== ChannelType.GuildText &&
        channel.type !== ChannelType.GuildVoice &&
        channel.type !== ChannelType.PublicThread &&
        channel.type !== ChannelType.PrivateThread
        // !channel.isTextBased() &&
        // !channel.isVoiceBased() &&
        // !channel.isThread()
      ) {
        await respond({
          embeds: [Utils.generateErrorMessage('Тип канала не подходит.', ErrorMessageType.Error)]
        })
        return
      }

      if (channel.guild.id === guild.id) {
        channel.isThread
        textChannelId = channel.id
      } else {
        await respond({
          embeds: [Utils.generateErrorMessage('Необходимо указать текстовый канал.', ErrorMessageType.Error)]
        })
        return
      }
    }

    player.setTextChannel(textChannelId)

    await respond({
      embeds: [
        Utils.generateErrorMessage(
          `Для уведомлений установлен текстовый канал <#${textChannelId}>`,
          ErrorMessageType.NoTitle
        )
      ]
    })
  }
})
