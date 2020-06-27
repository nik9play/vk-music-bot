export default async function pause(message, serverQueue, queue) {
  const voiceChannel = message.member.voice.channel
  if (!voiceChannel) return message.reply('вы должны быть в голосовом канале чтобы поставить музыку на паузу.')
  if (!serverQueue) return
  if (!serverQueue.connection.dispatcher.paused) {
    serverQueue.connection.dispatcher.pause()
    const id = message.guild.id
    serverQueue.exitTimer = setTimeout(async () => {
      const serverQueueNew = queue.get(id)
      if (!serverQueueNew) return
      await serverQueueNew.connection.dispatcher.resume()
      serverQueueNew.songs = []
      serverQueueNew.connection.dispatcher.end()
    }, 1800000)
  } else {
    serverQueue.connection.dispatcher.resume()
    if (serverQueue.exitTimer) clearTimeout(serverQueue.exitTimer)
  }
}