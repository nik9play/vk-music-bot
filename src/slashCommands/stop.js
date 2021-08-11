import generateErrorMessage from '../tools/generateErrorMessage'

export default {
  name: 'stop',
  aliases: ['s'],
  djOnly: true,
  cooldown: 1,
  execute: async ({ client, guild, respond, voice }) => { 
    const player = client.manager.get(guild.id)
    if (!player) return respond({ embeds: [generateErrorMessage('Сейчас ничего не играет.')], ephemeral: true })

    if (!voice) return respond({ embeds: [generateErrorMessage('Необходимо находиться в голосовом канале.')], ephemeral: true })
    //if (channel.id !== player.voiceChannel) return message.reply("вы находитесь не в том голосовом канале.")

    player.queue.clear()
    player.stop()
  
    respond({ embeds: [{ title: '⏹️ Воспроизведение остановлено и очередь остановлена.', color: 0x5181b8 }] }) 
  }
}