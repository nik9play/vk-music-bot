import { audioGetUser } from '../vkApi'
import addToQueue from '../tools/addToQueue'

export default {
  name: "vu",
  description: "Добавить музыку пользователя в очередь. Принимает 3 аргумента: `-vu <id>(обяз.) <count> <offset>`",
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

    const id = args[0]
    if (!id) return message.reply("неверный ID")
    const count = args[1] ?? 10
    let offset = args[2] ?? 1
    offset = (offset - 1) * count
    
    if (count > 1000) return message.reply("слишком большой `count`.")
    if (id.length < 1) return message.reply("слишком короткий запрос.")

    const res = await audioGetUser(id, count, offset, options.captcha, options.http)

    let newArray = res.newArray
    if (res.status == "error") {
      if (res.type == "empty") return message.reply("не могу найти музыку этого пользователя или команда неверна.")
  
      if (res.type == "captcha") {
        options.captchas.set(message.member.id, {
          type: "vu",
          args: args,
          url: res.data.captcha_img,
          sid: res.data.captcha_sid
        })
        const captcha = options.captchas.get(message.member.id)
        return message.reply(`прежде чем выполнить данный запрос, вы должны ввести капчу! Введите \`-vcaptcha <текст_с_картинки>\`. ${captcha.url}`)
      }
  
      return message.reply("ошибка. ¯\\_(ツ)_/¯")
    }
  
    const playlistEmbed = {
      title: res.info.name,
      thumbnail: {
        url: res.info.img
      },
      color: 0x5181b8,
      author: {
        name: "Треки следующего пользователя добавлены"
      },
      fields: [
        {
          name: "Добавлено треков",
          value: newArray.length,
          inline: true
        }
      ]
    }
  
    await addToQueue(options, message, voiceChannel, newArray)
    return message.channel.send({embed: playlistEmbed})
  }
} 