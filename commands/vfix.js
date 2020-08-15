export default {
  name: "vfix",
  description: "Перезапускает бота если что-то не так.",
  cooldown: 20,
  execute: async function(message, _args, options) {
    options.queue.delete(message.guild.id)
    const voiceConnection = message.guild.client.voice.connections.get(message.guild.id)

    if (voiceConnection) {
      if (voiceConnection.channel) {
        voiceConnection.channel.leave().catch(error => {
          console.log(error)
        })
      }
    }

    message.reply("мы сделали, что могли.")
  }
}