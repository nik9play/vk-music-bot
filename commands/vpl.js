import { audioGetPlaylist } from '../vkapi'
import parsePlaylistURL from '../tools/parsePlaylistURL'
import addToQueue from '../tools/addToQueue'

export default {
  name: "vpl",
  description: "Добавить музыку в очередь из плейлиста. Принимает 4 аргумента: `-vpl <ссылка на плейлист или альбом>(обяз.) <count> <offset>`.",
  cooldown: 5,
  execute: async function(message, args, options) {
    message.channel.startTyping()
    const voiceChannel = message.member.voice.channel
    if (!voiceChannel) return message.reply('вы должны быть в голосовом канале чтобы включить музыку.')
  
    const permissions = voiceChannel.permissionsFor(message.client.user)
    if (!permissions.has('CONNECT') || !permissions.has('SPEAK') || !permissions.has('VIEW_CHANNEL')) {
      return message.reply('мне нужны права чтобы играть музыку!')
    }
  
    const url = args[0]
    if (!url) return message.reply("неверная ссылка.")
    const urlObj = parsePlaylistURL(url)
    console.log(urlObj)
    const id = urlObj.id
    const access_key = urlObj.access_key

    if (!id) return message.reply("неверная ссылка.")

    const count = args[1] ?? 10
    let offset = args[2] ?? 1
    offset = (offset - 1) * count

    if (count > 100) return message.reply("слишком большой `count`.")

    const res = await audioGetPlaylist(id.split("_")[0], id.split("_")[1], count, offset, access_key, options.captcha, options.http)
    let newArray = res.newArray
    if (res.status == "error") {
      console.log(res)
      if (res.type == "empty") return message.reply("не могу найти плейлист или команда неверна.")
  
      if (res.type == "captcha") {
        options.captchas.set(message.member.id, {
          type: "addPlaylist",
          args: args,
          url: res.details.captcha_img,
          sid: res.details.captcha_sid
        })
        const captcha = options.captchas.get(message.member.id)
        return message.reply(`прежде чем выполнить данный запрос, вы должны ввести капчу! Введите \`-vcaptcha <текст_с_картинки>\`. ${captcha.url}`)
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
  
    await addToQueue(options, message, voiceChannel, newArray)
    return message.channel.send({embed: playlistEmbed})
  }
} 
