export default {
  name: "vdebug",
  cooldown: 3,
  execute: async function (message, _args, options) {
    console.log(options.queue.get(message.guild.id))
    const voiceConnection = message.guild.client.voice.connections.get(message.guild.id)
    console.log(voiceConnection)
  }
}