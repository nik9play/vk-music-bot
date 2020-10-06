export default {
  name: "vr",
  description: "Удалить трек/треки из очереди. Например: `-vr 3-8` или `-vr 3 5 6-8`",
  cooldown: 3,
  execute: async function(message, args, options) {
    const serverQueue = options.queue.get(message.guild.id)
    if (!serverQueue) return message.reply("нечего удалять.")
    const oldLength = serverQueue.songs.length
    args.forEach(a => {
      if (a.includes("-")) {
        const first = parseInt(a.split("-")[0])
        const last = parseInt(a.split("-")[1])
        
        if ((last > first) && (first > 1)) serverQueue.songs.splice(first-1, last-first+1)
      } else {
        a = parseInt(a)
        if (a > 1) serverQueue.songs.splice(a-1, 1)
      }
    })
    const newLength = serverQueue.songs.length
    message.reply(`удалено треков: \`${oldLength - newLength}\`.`)
  }
}