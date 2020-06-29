import play from './play'

export default async function shuffle(message, serverQueue, queue) {
  if (!serverQueue) return message.reply('нечего перемешивать.')
  if (serverQueue.songs.length < 3) return message.reply('слишком маленькая очередь.')
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

  const newArray = shuffleArray(serverQueue.songs)

  serverQueue.songs = newArray
  play(message.guild, serverQueue.songs[0], queue)
  message.reply("перемешано.")
}