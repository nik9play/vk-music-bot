import { ChannelType } from 'discord.js'
import { Command } from '../slashCommandManager.js'
import Utils, { ErrorMessageType } from '../utils.js'

export default new Command({
  name: 'text',
  djOnly: true,
  adminOnly: false,
  premium: false,
  cooldown: 1,
  execute: async ({ client, guild, respond, voice, text, interaction }) => {
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
        embeds: [Utils.generateErrorMessage('Необходимо находиться в голосовом канале.')],
        ephemeral: true
      })
      return
    }
    //if (channel.id !== player.voiceChannel) return message.reply("вы находитесь не в том голосовом канале.")

    let textChannel = text
    const channelParam = interaction.options.getChannel('канал', true)
    const channel = client.channels.cache.get(channelParam?.id)

    if (channel) {
      if (
        channel.type !== ChannelType.GuildText &&
        channel.type !== ChannelType.GuildVoice &&
        channel.type !== ChannelType.PublicThread &&
        channel.type !== ChannelType.PrivateThread
      ) {
        await respond({
          embeds: [Utils.generateErrorMessage('Необходимо указать текстовый канал.', ErrorMessageType.Error)]
        })
        return
      }

      if (channel.guild.id === guild.id) {
        textChannel = channel
      } else {
        await respond({
          embeds: [Utils.generateErrorMessage('Необходимо указать текстовый канал.', ErrorMessageType.Error)]
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
