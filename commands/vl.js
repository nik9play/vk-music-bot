export default {
  name: "vl",
  description: "Включает зацикливание очереди (`-vl queue`) или трека (`-vl song`). Чтобы выключить, используйте `-vl off`",
  cooldown: 2,
  execute: async function(message, args, options) {
    if (args[0] == "queue") {
      const serverQueue = options.queue.get(message.guild.id)
      if (!serverQueue) return message.reply("нечего зацикливать")

      serverQueue.loopType = 1
      serverQueue.loopSongs = [...serverQueue.songs]

      message.reply("включено зацикливание очереди")
    } else if (args[0] == "song") {
      const serverQueue = options.queue.get(message.guild.id)
      if (!serverQueue) return message.reply("нечего зацикливать")

      serverQueue.loopType = 2
      serverQueue.loopSongs = []
      serverQueue.loopSongs[0] = serverQueue.songs[0]

      message.reply("включено зацикливание текущего трека")
    } else if (args[0] == "off") {
      const serverQueue = options.queue.get(message.guild.id)
      if (!serverQueue) return

      serverQueue.loopType = 0
      serverQueue.loopSongs = []

      message.reply("зацикливание выключено")
    }
  }
}