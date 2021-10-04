export default {
  name: "reconnect",
  aliases: ["rec"],
  djOnly: true,
  execute: async function(message) {
    const player = message.client.manager.get(message.guild.id)
    if (!player) return message.reply("сейчас ничего не играет.")

    const voiceChannel = player.voiceChannel
    const textChannel = player.textChannel

    player.disconnect()

    setTimeout(() => {
      player.setVoiceChannel(voiceChannel)
      player.setTextChannel(textChannel)

      player.connect()
      setTimeout(() => {
        player.pause(false)
      }, 500)
    }, 500)
  }
}