import { audioGetPlaylist } from '../vkApi'
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
  
    if (voiceChannel.full) return message.reply("голосовой канал полон!")

    const url = args[0]
    if (!url) return message.reply("неверная ссылка.")
    const urlObj = parsePlaylistURL(url)

    const id = urlObj.id
    const access_key = urlObj.access_key

    if (!id) return message.reply("неверная ссылка.")

    const count = args[1] ?? 10
    let offset = args[2] ?? 1
    offset = (offset - 1) * count

    if (count > 1000) return message.reply("слишком большой `count`.")

    const res = await audioGetPlaylist(id.split("_")[0], id.split("_")[1], count, offset, access_key, options.captcha, options.http)
    let newArray = res.newArray
    if (res.status == "error") {
      if (res.type == "empty") return message.reply("не могу найти плейлист или команда неверна.")
  
      if (res.type == "captcha") {
        options.captchas.set(message.member.id, {
          type: "vpl",
          args: args,
          url: res.details.captcha_img,
          sid: res.details.captcha_sid
        })
        const captcha = options.captchas.get(message.member.id)
        return message.reply(`прежде чем выполнить данный запрос, вы должны ввести капчу! Введите \`-vcaptcha <текст_с_картинки>\`. ${captcha.url}`)
      }
  
      return message.reply("ошибка. Возможно, не хватает прав для воспроизведения плейлиста (нет ключа доступа в ссылке).")
    }

    const playlistEmbed = {
      title: res.info.title,
      description: res.info.description,
      color: 0x5181b8,
      thumbnail: {
        url: res.info.imgUrl
      },
      author: {
        name: "Добавлены треки из следующего плейлиста"
      },
      fields: [
        {
          name: "Добавлено треков",
          value: newArray.length,
          inline: true
        },
        {
          name: "Всего треков",
          value: res.info.count,
          inline: true
        }
      ]
    }
  
    await addToQueue(options, message, voiceChannel, newArray)
    return message.channel.send({embed: playlistEmbed})
  }
} 
