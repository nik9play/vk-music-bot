import GetMany from '../vkapi/GetMany'
import { Duration } from 'luxon'

export default {
  name: "search",
  adminOnly: true,
  aliases: ["h"],
  cooldown: 5,
  execute: async function (message, args, options) {
    const search = args.join(' ')

    let audioGetMany = new GetMany()

    const query = {}

    if (options) {
      if (options.captcha) {
        query.captcha_sid = options.captcha.sid
        query.captcha_key = options.captcha.captcha_key
      }
    }

    const req = await audioGetMany.execute({
      q: search,

      ...query
    })

    if (req.status === "error") {
      console.log("error:   ", req)
      if (req.type === "captcha") {
        message.client.captcha.set(message.guild.id, {
          type: 'search',
          args,
          url: req.data.captcha_img,
          sid: req.data.captcha_sid
        })

        const captcha = message.client.captcha.get(message.guild.id)
        const embed = {
          description: "Ошибка! Требуется капча. Введите команду `-vcaptcha`, а после код с картинки.",
          color: 0x5181b8,
          image: {
            url: captcha.url
          }
        }

        return message.channel.send({embed: embed})
      } else if (req.type === "empty") {
        return message.reply("не удалось ничего найти по запросу.")
      } else if (req.type === "api") {
        return message.reply("ошибка API.")
      } else if (req.type === "request") {
        return message.reply("ошибка подключения.")
      }
    }

    let description = ""

    req.tracks.map((value, index) => {
      description += `${index + 1}. ${value.author} — ${value.title}\n`
    })

    description += "\n:arrow_down_small: **Чтобы выбрать трек, введите его номер ниже** :arrow_down_small:"

    const embed = {
      color: 0x5181b8,
      title: "Результаты поиска",
      description
    }

    const filter = response => {
      return parseInt(response.content) <= req.tracks.length
    }

    message.channel.send({embed: embed}).then(msg => {
      message.channel.awaitMessages(filter, { max: 1, time: 30000, errors: ['time'] })
      .then(async collected => {
        msg.delete()

        const { channel } = message.member.voice
        if (!channel) return message.reply('необходимо находиться в голосовом канале.')
        
        const permissions = channel.permissionsFor(message.client.user)
        if (!permissions.has('CONNECT') || !permissions.has('SPEAK') || !permissions.has('VIEW_CHANNEL')) {
          return message.reply('мне нужны права, чтобы войти в канал.')
        }
    
        const player = message.client.manager.create({
          guild: message.guild.id,
          voiceChannel: channel.id,
          textChannel: message.channel.id,
          selfDeafen: true
        })
    
        if (player.state !== "CONNECTED") player.connect()
    
        if (!player.voiceChannel) {
          player.setVoiceChannel(channel.id)
          player.connect()
        }
    
        console.log("player info: ", player.guild, player.voiceChannel, player.state)
        //if (channel.id !== player.voiceChannel) return message.reply("вы находитесь не в том голосовом канале.")
    
        // сброс таймера и снятие с паузы при добавлении в очередь
        if (player.paused) player.pause(false)
        if (message.client.timers.has(message.guild.id))
          clearTimeout(message.client.timers.get(message.guild.id))

        const track = req.tracks[parseInt(collected.first().content) - 1]

        const songEmbed = {
          color: 0x5181b8,
          title: track.title,
          author: {
            name: "Трек добавлен!"
          },
          description: track.author,
          fields: [
            {
              name: 'Длительность',
              value: Duration.fromObject({seconds: track.duration}).toFormat("mm:ss")
            }
          ]
        }

        let res

        try {
          res = await player.search(track.url)
          if (res.loadType === 'LOAD_FAILED') {
            if (!player.queue.current) player.destroy()
            throw res.exception
          }
        } catch (err) {
          return message.reply(`ошибка: ${err.message}`)
        }

        switch (res.loadType) {
          case 'NO_MATCHES':
            if (!player.queue.current) player.destroy()
            return message.reply('ошибка.')
          case 'TRACK_LOADED':
            res.tracks[0].title = track.title
            res.tracks[0].author = track.author

            player.queue.add(res.tracks[0])
    
            if (!player.playing && !player.paused && !player.queue.size) player.play()
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