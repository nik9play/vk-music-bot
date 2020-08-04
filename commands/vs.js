export default {
  name: "vs",
  description: "Выключить музыку и очистить очередь",
  cooldown: 5,
  execute: async function(message, _args, options) {
    const voiceConnection = message.client.voice.connections.get(message.guild.id)

    if (!voiceConnection) return message.reply('бот не в голосовом канале.')
    if (!options.serverQueue) return message.reply('нечего останавливать.')

    clearTimeout(options.serverQueue.exitTimer)

    await voiceConnection.dispatcher.resume()
    options.serverQueue.songs = []
    voiceConnection.dispatcher.end()
    message.react('⏹️')
  }
}