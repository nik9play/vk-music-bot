import getQueueContructTemplate from '../tools/getQueueConstructTemplate'
import { audioGetPlaylist } from '../vkapi'
import play from '../tools/play'
import parsePlaylistURL from '../tools/parsePlaylistURL'

export default {
  name: "vpl",
  description: "Добавить музыку в очередь из плейлиста. Принимает 4 аргумента: `-vpl <ссылка на плейлист или альбом>(обяз.) <count> <offset>`.",
  execute: async function(message, args, options) {
    message.channel.startTyping()
    const voiceChannel = message.member.voice.channel
    if (!voiceChannel) return message.reply('вы должны быть в голосовом канале чтобы включить музыку.')
  
    const permissions = voiceChannel.permissionsFor(message.client.user)
    if (!permissions.has('CONNECT') || !permissions.has('SPEAK')) {
      return message.reply('мне нужны права чтобы играть музыку!')
    }
  
    const url = args[0]
    if (!url) return message.reply("неверная ссылка.")
    const urlObj = parsePlaylistURL(url)
    
    const id = urlObj.id
    const access_key = urlObj.access_key

    if (!id) return message.reply("неверная ссылка.")

    const count = args[1] ?? 10
    const offset = args[2] ?? 1
    
    if (count > 100) return message.reply("слишком большой `count`.")

    const res = await audioGetPlaylist(id.split("_")[0], id.split("_")[1], count, offset, access_key, options.captcha)
    let newArray = res.newArray
    if (res.status == "error") {
      if (res.message == "empty-api") return message.reply("не могу найти плейлист.")
  
      if (res.details.error_code == 14) {
        options.captchas.set(message.member.id, {
          type: "addPlaylist",
          args: args,
          url: res.details.captcha_img,
          sid: res.details.captcha_sid
        })
        const captcha = options.captchas.get(message.member.id)
        return message.reply(`Прежде чем выполнить данный запрос, вы должны ввести капчу! Введите \`-vcaptcha <текст_с_картинки>\`. ${captcha.url}`)
      }
  
      return message.reply("ошибка. ¯\\_(ツ)_/¯")
    }
  
    const playlistEmbed = {
      color: 0x5181b8,
      title: `Добавлено треков: **${newArray.length}**.`,
      author: {
        name: "Плейлист добавлен!"
      }
    }
  
    if (!options.serverQueue) {
      const queueContruct = getQueueContructTemplate(message, voiceChannel)
  
      options.queue.set(message.guild.id, queueContruct)
  
      queueContruct.songs = [...queueContruct.songs, ...newArray]
  
      try {
        let connection = await voiceChannel.join()
        queueContruct.connection = connection
        play(message.guild, queueContruct.songs[0], options)
        return message.channel.send({embed: playlistEmbed})
      } catch (err) {
        console.log(err)
        options.queue.delete(message.guild.id)
        return message.channel.send(err)
      }
    } else {
      options.serverQueue.songs = options.serverQueue.songs.concat(newArray)
  
      return message.channel.send({embed: playlistEmbed})
    }
  }
} 
