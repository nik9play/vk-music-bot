export default {
  name: "vs",
  description: "Выключить музыку и очистить очередь",
  cooldown: 5,
  execute: async function(message, _args, options) {
    const voiceConnection = message.client.voice.connections.get(message.guild.id)

    if (!voiceConnection) return message.reply('бот не в голосовом канале.')
    if (!options.serverQueue) return message.reply('нечего останавливать.')

    clearTimeout(options.serverQueue.exitTimer)

    try {
      await voiceConnection.dispatcher.resume()
    } catch {
      console.log("empty dispatcher err")
    }

    options.serverQueue.songs = []
    try {
      await voiceConnection.dispatcher.end()
    } catch {
      options.queue.delete(message.guild.id)
    }
    message.react('⏹️')
  }
}