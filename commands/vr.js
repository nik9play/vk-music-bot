export default {
  name: "vr",
  description: "Удалить трек/треки из очереди. Например: `-vr 3-8` или `-vr 3 5 6-8`",
  execute: async function(message, args, options) {
    if (!options.serverQueue) return
    const oldLength = options.serverQueue.songs.length
    args.forEach(a => {
      if (a.includes("-")) {
        const first = parseInt(a.split("-")[0])
        const last = parseInt(a.split("-")[1])
        
        if ((last > first) && (first > 1)) options.serverQueue.songs.splice(first-1, last-first+1)
      } else {
        a = parseInt(a)
        if (a > 1) options.serverQueue.songs.splice(a-1, 1)
      }
    })
    const newLength = options.serverQueue.songs.length
    message.reply(`удалено треков: \`${oldLength - newLength}\`.`)
  }
}