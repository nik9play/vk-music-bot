import play from '../tools/play'
import checkPremium from '../tools/checkPremium'

export default {
  name: "vsh",
  description: "Перемешать очередь",
  execute: async function(message, _args, options) {
    checkPremium(message, () => {
      if (!options.serverQueue) return message.reply('нечего перемешивать.')
      if (options.serverQueue.songs.length < 3) return message.reply('слишком маленькая очередь.')
      function shuffleArray(array) {
        let arrayCopy = array
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
    
      const newArray = shuffleArray(options.serverQueue.songs)
    
      options.serverQueue.songs = newArray
      play(message.guild, options.serverQueue.songs[0], options)
      message.reply("перемешано.")
    })
  }
}