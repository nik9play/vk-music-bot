import { audioGetUser } from '../vkapi'
import addToQueue from '../tools/addToQueue'

export default {
  name: "vu",
  description: "Добавить музыку пользователя в очередь. Принимает 3 аргумента: `-vu <id>(обяз.) <count> <offset>`",
  execute: async function(message, args, options) {
    message.channel.startTyping()
    const voiceChannel = message.member.voice.channel
    if (!voiceChannel) return message.reply('вы должны быть в голосовом канале чтобы включить музыку.')
    
    const permissions = voiceChannel.permissionsFor(message.client.user)
    if (!permissions.has('CONNECT') || !permissions.has('SPEAK')) {
      return message.reply('мне нужны права чтобы играть музыку!')
    }
  
    const id = args[0]
    if (!id) return message.reply("неверный ID")
    const count = args[1] ?? 10
    const offset = args[2] ?? 1
    if (count > 100) return message.reply("слишком большой `count`.")
    if (id.length < 3) return message.reply("слишком короткий запрос.")

    const res = await audioGetUser(id, count, offset, options.captcha, options.http)

    let newArray = res.newArray
    if (res.status == "error") {
      if (res.type == "empty") return message.reply("не могу найти аудио у этого пользователя.")
  
      if (res.type == "captcha") {
        options.captchas.set(message.member.id, {
          type: "addUser",
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
      color: 0x5181b8,
      title: `Добавлено треков: **${newArray.length}**.`,
      author: {
        name: "Музыка пользователя добавлена!"
      }
    }
  
    await addToQueue(options, message, voiceChannel, newArray)
    return message.channel.send({embed: playlistEmbed})
  }
} 