export default {
  name: "vs",
  description: "Выключить музыку и очистить очередь",
  execute: async function(message, _args, options) {
    const voiceChannel = message.client.voice.connections.get(message.guild.id)

    if (!voiceChannel) return message.reply('бот не в голосовом канале.')
    if (!options.serverQueue) return message.reply('нечего останавливать.')
    
    await options.serverQueue.connection.dispatcher.resume()
    options.serverQueue.songs = []
    options.serverQueue.connection.dispatcher.end()
    message.react('⏹️')
  }
}