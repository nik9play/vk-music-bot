export default async function stop(message, serverQueue) {
  const voiceChannel = message.member.voice.channel
  if (!voiceChannel) return message.reply('вы должны быть в голосовом канале чтобы остановить музыку.')
  if (!serverQueue) return message.reply('нечего останавливать.')
  await serverQueue.connection.dispatcher.resume()
  serverQueue.songs = []
  serverQueue.connection.dispatcher.end()
  message.react('👍')
}