export default {
  name: "vs",
  description: "Выключить музыку и очистить очередь",
  execute: async function(message, _args, options) {
    const voiceChannel = message.member.voice.channel
    if (!voiceChannel) return message.reply('вы должны быть в голосовом канале чтобы остановить музыку.')
    if (!options.serverQueue) return message.reply('нечего останавливать.')
    await options.serverQueue.connection.dispatcher.resume()
    options.serverQueue.songs = []
    options.serverQueue.connection.dispatcher.end()
    message.react('⏹️')
  }
}