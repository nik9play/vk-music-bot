export default {
  name: "vdebug",
  cooldown: 10,
  execute: async function (message, _args, options) {
    console.log(options.queue.get(message.guild.id))
    const voiceConnection = message.guild.client.voice.connections.get(message.guild.id)

    if (voiceConnection) {
      console.log(voiceConnection)
      if (voiceConnection.channel) {
        const voicePermissions = voiceConnection.channel.permissionsFor(message.client.user)
        console.log(`Права для голосового канал: ${voicePermissions.toArray()}`)
      }
    }

    const textPermissions = message.channel.permissionsFor(message.client.user)
    console.log(`Права для текстового канал: ${textPermissions.toArray()}`)
    message.reply("дебаг инфа отправлена в консоль")
  }
}