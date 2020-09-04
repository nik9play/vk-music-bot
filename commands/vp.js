import { audioGetOne } from '../vkApi'
import { Duration } from 'luxon'
import addToQueue from '../tools/addToQueue'

export default {
  name: "vp",
  description: "Включить музыку по названию или по ID",
  cooldown: 4,
  execute: async function(message, args, options) {
    message.channel.startTyping()
    const voiceChannel = message.member.voice.channel
    if (!voiceChannel) return message.reply('вы должны быть в голосовом канале чтобы включить музыку.')
  
    const permissions = voiceChannel.permissionsFor(message.client.user)
    if (!permissions.has('CONNECT') || !permissions.has('SPEAK') || !permissions.has('VIEW_CHANNEL')) {
      return message.reply('мне нужны права чтобы играть музыку!')
    }

    if (voiceChannel.full) return message.reply("голосовой канал полон!")
  
    const query = args.join(" ").trim()
    if (query.length < 3) return message.reply("слишком короткий запрос.")

    const res = await audioGetOne(query, options.captcha, options.http)
    
    if (res.status == "error") {
      if (res.type == "empty") return message.reply("не могу найти трек.")
  
      if (res.type == "captcha") {
        options.captchas.set(message.member.id, {
          type: "vp",
          args: args,
          url: res.data.captcha_img,
          sid: res.data.captcha_sid
        })
        const captcha = options.captchas.get(message.member.id)
        return message.reply(`прежде чем выполнить данный запрос, вы должны ввести капчу! Введите \`-vcaptcha <текст_с_картинки>\`. ${captcha.url}`)
      }

      return message.reply("ошибка.")
    }
  
    const song = res.songInfo
  
    const songEmbed = {
      color: 0x5181b8,
      title: song.title,
      author: {
        name: "Трек добавлен!"
      },
      description: song.artist,
      fields: [
        {
          name: 'Длительность',
          value: Duration.fromObject({seconds: song.duration}).toFormat("mm:ss")
        },
      ]
    }
  
    await addToQueue(options, message, voiceChannel, [song])
    return message.channel.send({embed: songEmbed})
  }
}