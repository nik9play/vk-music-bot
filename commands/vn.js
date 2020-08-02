export default {
  name: "vn",
  description: "Пропустить трек",
  execute: async function skip(message, _args, options) {
    const voiceConnection = message.client.voice.connections.get(message.guild.id)
    
    if (!voiceConnection) return message.reply('бот не в голосовом канале.')
    if (!options.serverQueue) return message.reply('некуда пропускать.')

    await voiceConnection.dispatcher.resume()
    voiceConnection.dispatcher.end()
    message.react('⏭️')
  }
} 