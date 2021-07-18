import VK from '../apis/VK'
import generateErrorMessage from '../tools/generateErrorMessage'

export default {
  name: "search",
  djOnly: true,
  cooldown: 5,
  execute: async function ({ guild, client, args, captcha, respond }) {
    const search = args.join(' ')

    const vk = new VK()

    const query = {}

    if (captcha) {
      query.captcha_sid = captcha.sid
      query.captcha_key = captcha.captcha_key
    }

    const req = await vk.GetMany({
      q: search,

      ...query
    })

    if (req.status === "error") {
      console.log("error:   ", req)
      if (req.type === "captcha") {
        client.captcha.set(guild.id, {
          type: 'search',
          args,
          url: req.data.captcha_img,
          sid: req.data.captcha_sid
        })

        const captcha = client.captcha.get(guild.id)
        const embed = {
          description: "Ошибка! Требуется капча. Введите команду `-vcaptcha`, а после код с картинки.",
          color: 0x5181b8,
          image: {
            url: captcha.url
          }
        }

        return respond(embed)
      } else if (req.type === "empty") {
        return respond(generateErrorMessage('Не удалось ничего найти по запросу или плейлиста не существует.'))
      } else if (req.type === "api") {
        return respond(generateErrorMessage('Неверный формат ссылки или запроса.'))
      } else if (req.type === "request") {
        return respond(generateErrorMessage('Ошибка запроса к ВК.'))
      }
    }

    let description = ""
    let buttons = [{
      type: 1,
      components: []
    }]

    req.tracks.map((value, index) => {
      description += `${index + 1}. ${value.author} — ${value.title}\n`
      buttons[0].components.push({
        type: 2,
        label: index + 1,
        style: 1,
        custom_id: "search," + value.id
      })
    })

    description += "\n**Чтобы выбрать трек, нажмите на его номер**"

    const embed = {
      color: 0x5181b8,
      title: "Результаты поиска",
      description
    }

    respond(embed, 'embed', buttons, 30000)

    // message.channel.send({embed: embed}).then(msg => {
    //   message.channel.awaitMessages(filter, { max: 1, time: 30000, errors: ['time'] })
    //   .then(async collected => {
    //     msg.delete()

    //     const { channel } = message.member.voice
    //     if (!channel) return message.reply('необходимо находиться в голосовом канале.')

    //     const permissions = channel.permissionsFor(message.client.user)
    //     if (!permissions.has('CONNECT') || !permissions.has('SPEAK') || !permissions.has('VIEW_CHANNEL')) {
    //       return message.reply('мне нужны права, чтобы войти в канал.')
    //     }
    
    //     const player = message.client.manager.create({
    //       guild: message.guild.id,
    //       voiceChannel: channel.id,
    //       textChannel: message.channel.id,
    //       selfDeafen: true
    //     })
    
    //     if (player.state !== "CONNECTED") player.connect()
    
    //     if (!player.voiceChannel) {
    //       player.setVoiceChannel(channel.id)
    //       player.connect()
    //     }
    
    //     console.log("player info: ", player.guild, player.voiceChannel, player.state)
    //     //if (channel.id !== player.voiceChannel) return message.reply("вы находитесь не в том голосовом канале.")
    
    //     // сброс таймера и снятие с паузы при добавлении в очередь
    //     if (player.paused) player.pause(false)
    //     if (message.client.timers.has(message.guild.id))
    //       clearTimeout(message.client.timers.get(message.guild.id))

    //     const track = req.tracks[parseInt(collected.first().content) - 1]

    //     const songEmbed = {
    //       color: 0x5181b8,
    //       title: track.title,
    //       author: {
    //         name: "Трек добавлен!"
    //       },
    //       thumbnail: {
    //         url: track.thumb
    //       },
    //       description: track.author,
    //       fields: [
    //         {
    //           name: 'Длительность',
    //           value: Duration.fromObject({seconds: track.duration}).toFormat("mm:ss")
    //         }
    //       ]
    //     }

    //     let res

    //     try {
    //       res = await player.search(track.url)
    //       if (res.loadType === 'LOAD_FAILED') {
    //         if (!player.queue.current) player.destroy()
    //         throw res.exception
    //       }
    //     } catch (err) {
    //       return message.reply(`ошибка: ${err.message}`)
    //     }

    //     switch (res.loadType) {
    //       case 'NO_MATCHES':
    //         if (!player.queue.current) player.destroy()
    //         return message.reply('ошибка.')
    //       case 'TRACK_LOADED':
    //         res.tracks[0].title = track.title
    //         res.tracks[0].author = track.author

    //         player.queue.add(res.tracks[0])
    
    //         if (!player.playing && !player.paused && !player.queue.size) player.play()
    //     }

    //     message.channel.send({embed: songEmbed})

    //     const textPermissions = message.channel.permissionsFor(message.client.user)
    //     if (textPermissions.has("ADD_REACTIONS"))
    //       collected.first().react("👌")
    //   })
    //   .catch(() => {
    //     msg.delete()
    //   })
    // })
  }
}