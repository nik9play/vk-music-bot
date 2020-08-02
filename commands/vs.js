export default {
  name: "vs",
  description: "Выключить музыку и очистить очередь",
  execute: async function(message, _args, options) {
    const voiceConnection = message.client.voice.connections.get(message.guild.id)

    if (!voiceConnection) return message.reply('бот не в голосовом канале.')
    if (!options.serverQueue) return message.reply('нечего останавливать.')

    await voiceConnection.dispatcher.resume()
    options.serverQueue.songs = []
    voiceConnection.dispatcher.end()
    message.react('⏹️')
  }
}