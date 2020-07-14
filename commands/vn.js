export default {
  name: "vn",
  description: "Пропустить трек",
  execute: async function skip(message, _args, options) {
    const voiceChannel = message.member.voice.channel
    if (!voiceChannel) return message.reply('вы должны быть в голосовом канале чтобы пропустить музыку.')
    if (!options.serverQueue) return message.reply('некуда пропускать.')
    await options.serverQueue.connection.dispatcher.resume()
    options.serverQueue.connection.dispatcher.end()
    message.react('⏭️')
  }
} 