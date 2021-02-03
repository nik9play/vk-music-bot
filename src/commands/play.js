/* eslint-disable no-case-declarations */
import GetOne from '../vkapi/GetOne'
import GetPlaylist from '../vkapi/GetPlaylist'
import GetUser from '../vkapi/GetUser'

import detectArgType from '../tools/detectArgType'

import { Duration } from 'luxon'
import { TrackUtils } from 'erela.js-vk'

export default {
  name: "play",
  aliases: ["p", "pl"],
  djOnly: true,
  cooldown: 2,
  execute: async (message, args, options) => {
    const { channel } = message.member.voice

    if (!channel) return message.reply('необходимо находиться в голосовом канале.')
    if (!args.length) return message.reply('вставьте после команды ссылку на плейлист или альбом, ID пользователя или трека.')

    const player = message.client.manager.create({
      guild: message.guild.id,
      voiceChannel: channel.id,
      textChannel: message.channel.id,
    })

    if (player.state !== "CONNECTED") player.connect()

    const search = args.join(' ')

    const count = args[1] ?? 10
    let offset = args[2] ?? 1
    offset = (offset - 1) * count

    const arg = detectArgType(args[0])

    let req

    let audioGetOne = new GetOne()
    let audioGetPlaylist = new GetPlaylist()
    let audioGetUser = new GetUser()

    const query = {}

    if (options) {
      if (options.captcha) {
        query.captcha_sid = options.captcha.captcha_sid
        query.captcha_key = options.captcha.captcha_key
      }
    }

    switch (arg.type) {
      case "track":
        req = await audioGetOne.execute({
          q: search,

          ...query
        })
        break
      case "playlist":
        req = await audioGetPlaylist.execute({
          owner_id: arg.parsedURL.id.split("_")[0],
          album_id: arg.parsedURL.id.split("_")[1],
          count,
          offset,
          access_key: arg.parsedURL.access_key,

          ...query
        })
        break
      case "group":
      case "user":
        req = await audioGetUser.execute({
          owner_id: arg.id,
          count,
          offset,

          ...query
        })
        break
    }

    if (req.status === "error") {
      if (req.type === "captcha") {
        message.client.captcha.set(message.guild.id, {
          args,
          url: req.data.captcha_img,
          sid: req.data.captcha_sid
        })

        const captcha = message.client.captcha.get(message.guild.id)
        const embed = {
          description: "Ошибка! Требуется капча. Введите команду `captcha`, а после код с картинки.",
          color: 0x5181b8,
          image: {
            url: captcha.url
          }
        }

        return message.channel.send(embed)
      } else if (req.type === "empty") {
        return message.reply("не удалось ничего найти по запросу.")
      } else if (req.type === "api") {
        return message.reply("ошибка API.")
      } else if (req.type === "request") {
        return message.reply("ошибка подключения.")
      }
    }

    if (arg.type === "track") {
      const songEmbed = {
        color: 0x5181b8,
        title: req.title,
        author: {
          name: "Трек добавлен!"
        },
        description: req.author,
        fields: [
          {
            name: 'Длительность',
            value: Duration.fromObject({seconds: req.duration}).toFormat("mm:ss")
          }
        ]
      }

      let res

      try {
        res = await player.search(req.url)
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
          res.tracks[0].title = req.title
          res.tracks[0].author = req.author

          player.queue.add(res.tracks[0])
  
          if (!player.playing && !player.paused && !player.queue.size) player.play()
      }

      return message.channel.send({embed: songEmbed})
    } else if (arg.type === "playlist") {
      const newArray = req.newArray

      const playlistEmbed = {
        title: req.info.title,
        description: req.info.description,
        color: 0x5181b8,
        thumbnail: {
          url: req.info.imgUrl
        },
        author: {
          name: "Добавлены треки из плейлиста"
        },
        fields: [
          {
            name: "Добавлено треков",
            value: newArray.length,
            inline: true
          },
          {
            name: "Всего треков",
            value: req.info.count,
            inline: true
          }
        ]
      }
    
      for await (const e of newArray) {
        const unresolvedTrack = TrackUtils.buildUnresolvedQuery(e.url)

        unresolvedTrack.title = e.title
        unresolvedTrack.author = e.author

        player.queue.add(unresolvedTrack)
        if (!player.playing && !player.paused && !player.queue.size) player.play()
      }

      return message.channel.send({embed: playlistEmbed})
    } else if (arg.type === "user") {
      const newArray = req.newArray

      const playlistEmbed = {
        title: req.info.name,
        thumbnail: {
          url: req.info.img
        },
        color: 0x5181b8,
        author: {
          name: "Добавлены треки пользователя"
        },
        fields: [
          {
            name: "Добавлено треков",
            value: newArray.length,
            inline: true
          }
        ]
      }

      for await (const e of newArray) {
        const unresolvedTrack = TrackUtils.buildUnresolvedQuery(e.url)

        unresolvedTrack.title = e.title
        unresolvedTrack.author = e.author

        player.queue.add(unresolvedTrack)
        if (!player.playing && !player.paused && !player.queue.size) player.play()
      }

      return message.channel.send({embed: playlistEmbed})
    } else if (arg.type === "group") {
      const newArray = req.newArray

      const playlistEmbed = {
        title: req.info.name,
        description: req.info.description,
        thumbnail: {
          url: req.info.img
        },
        color: 0x5181b8,
        author: {
          name: "Добавлены треки из сообщества"
        },
        fields: [
          {
            name: "Добавлено треков",
            value: newArray.length,
            inline: true
          }
        ]
      }

      for await (const e of newArray) {
        const unresolvedTrack = TrackUtils.buildUnresolvedQuery(e.url)

        unresolvedTrack.title = e.title
        unresolvedTrack.author = e.author

        player.queue.add(unresolvedTrack)
        if (!player.playing && !player.paused && !player.queue.size) player.play()
      }

      return message.channel.send({embed: playlistEmbed})
    }
  }
}