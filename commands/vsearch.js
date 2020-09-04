import { audioSearch } from "../vkApi"
import addToQueue from "../tools/addToQueue"
import { Duration } from "luxon"

export default {
  name: "vsearch",
  description: "Поиск в базе ВК и отображение первых 10 результатов",
  cooldown: 15,
  execute: async function (message, args, options) {
    const query = args.join(" ").trim()
    if (query.length < 3) return message.reply("слишком короткий запрос.")

    const res = await audioSearch(query, options.captcha, options.http)

    if (res.status == "error") {
      if (res.type == "empty") return message.reply("по запросу ничего не найдено.")
  
      if (res.type == "captcha") {
        options.captchas.set(message.member.id, {
          type: "vsearch",
          args: args,
          url: res.data.captcha_img,
          sid: res.data.captcha_sid
        })
        const captcha = options.captchas.get(message.member.id)
        return message.reply(`прежде чем выполнить данный запрос, вы должны ввести капчу! Введите \`-vcaptcha <текст_с_картинки>\`. ${captcha.url}`)
      }

      return message.reply("ошибка.")
    }

    let description = ""

    res.result.map((value, index) => {
      description += `${index + 1}. ${value.artist} — ${value.title}\n`
    })

    description += "\n:arrow_down_small: **Чтобы выбрать трек, введите его номер ниже** :arrow_down_small:"

    const embed = {
      color: 0x5181b8,
      title: "Результаты поиска",
      description
    }

    const filter = response => {
      return parseInt(response.content) <= res.result.length
    }

    message.channel.send({embed: embed}).then(msg => {
      message.channel.awaitMessages(filter, { max: 1, time: 30000, errors: ['time'] })
      .then(collected => {
        msg.delete()
        const voiceChannel = message.member.voice.channel
        if (!voiceChannel) return message.reply('вы должны быть в голосовом канале чтобы включить музыку.')
  
        const permissions = voiceChannel.permissionsFor(message.client.user)
        if (!permissions.has('CONNECT') || !permissions.has('SPEAK') || !permissions.has('VIEW_CHANNEL')) {
          return message.reply('мне нужны права чтобы играть музыку!')
        }
    
        if (voiceChannel.full) return message.reply("голосовой канал полон!")

        const song = res.result[parseInt(collected.first().content) - 1]

        addToQueue(options, message, voiceChannel, [song])

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

        message.channel.send({embed: songEmbed})

        const textPermissions = message.channel.permissionsFor(message.client.user)
        if (textPermissions.has("ADD_REACTIONS"))
        collected.first().react("👌")
      })
      .catch(() => {
        msg.delete()
      })
    })
  }
}