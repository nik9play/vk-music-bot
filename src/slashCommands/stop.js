import generateErrorMessage from "../tools/generateErrorMessage"

export default {
  name: "stop",
  aliases: ["s"],
  djOnly: true,
  cooldown: 1,
  execute: async ({ client, guild, respond, voice }) => { 
    const player = client.manager.get(guild.id)
    if (!player) return respond(generateErrorMessage("Сейчас ничего не играет.", 'warning'))

    if (!voice) return respond(generateErrorMessage('Необходимо находиться в голосовом канале.'))
    //if (channel.id !== player.voiceChannel) return message.reply("вы находитесь не в том голосовом канале.")

    player.queue.clear()
    player.stop()

    respond('**Остановлено**', 'text') 
  }
}