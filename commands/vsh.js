import vps from './vps'

export default {
  name: "vsh",
  description: "Перемешать очередь",
  premium: true,
  cooldown: 5,
  execute: async function(message, _args, options) {
    const serverQueue = options.queue.get(message.guild.id)

    if (serverQueue.loopType != 0) {
      message.reply("отключите зацикливание (`-vl off`) и попробуйте снова.")
    }

    if (!serverQueue) return message.reply('нечего перемешивать.')
    if (serverQueue.songs.length < 3) return message.reply('слишком маленькая очередь.')

    const player = options.shoukaku.getPlayer(message.guild.id)
    if (!player) return
    if (player.paused) await vps.execute(message, _args, options)

    function shuffleArray(array) {
      let arrayCopy = [...array]
      let currentIndex = arrayCopy.length
      let temporaryValue, randomIndex
      while (0 !== currentIndex) {
        randomIndex = Math.floor(Math.random() * currentIndex);
        currentIndex -= 1;
    
        temporaryValue = arrayCopy[currentIndex]
        arrayCopy[currentIndex] = arrayCopy[randomIndex]
        arrayCopy[randomIndex] = temporaryValue
      }
      return arrayCopy
    }
    
    const newArray = shuffleArray(serverQueue.songs)
  
    serverQueue.songs = [serverQueue.songs[0]]
    serverQueue.songs = [...serverQueue.songs, ...newArray]

    player.stopTrack()

    message.reply("перемешано.")
  }
}