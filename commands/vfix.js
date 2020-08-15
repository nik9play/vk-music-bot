export default {
  name: "vfix",
  description: "Перезапускает бота если что-то не так.",
  cooldown: 20,
  execute: async function(message, _args, options) {
    options.queue.delete(message.guild.id)
    const voiceConnection = message.guild.client.voice.connections.get(message.guild.id)

    voiceConnection.channel.leave().catch(error => {
      console.log(`${error}: fff`)
    })

    try {
      voiceConnection.channel.leave()
    } catch {
      console.error(`${message.guild.id}: FIX channel leave error`)
    }

    message.reply("мы сделали, что могли.")
  }
}