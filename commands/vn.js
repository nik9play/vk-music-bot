export default {
  name: "vn",
  description: "Пропустить трек",
  cooldown: 3,
  execute: async function skip(message, _args, options) {
    const voiceConnection = message.client.voice.connections.get(message.guild.id)
    
    if (!voiceConnection) return message.reply('бот не в голосовом канале.')
    if (!options.serverQueue) return message.reply('некуда пропускать.')

    if (voiceConnection.dispatcher) {
      await voiceConnection.dispatcher.resume()
      voiceConnection.dispatcher.end()
    }
    
    const textPermissions = message.channel.permissionsFor(message.client.user)
    if (textPermissions.has("ADD_REACTIONS"))
      message.react('⏭️')
  }
} 