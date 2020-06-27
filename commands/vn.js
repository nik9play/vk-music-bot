export default async function skip(message, serverQueue) {
  const voiceChannel = message.member.voice.channel
  if (!voiceChannel) return message.reply('вы должны быть в голосовом канале чтобы пропустить музыку.')
  if (!serverQueue) return message.reply('некуда пропускать.')
  await serverQueue.connection.dispatcher.resume()
  serverQueue.connection.dispatcher.end()
  message.react('👍')
}