/* eslint-disable no-case-declarations */
import VK from '../apis/VK'

import detectArgType from '../tools/detectArgType'
import declOfNum from '../tools/declOfNum'
import generateErrorMessage from '../tools/generateErrorMessage'

import { Duration } from 'luxon'
import { TrackUtils } from 'erela.js-vk'
import generateRandomCaptchaString from '../tools/generateRandomCaptchaString'

import logger from '../tools/logger'
import escapeFormat from '../tools/escapeFormat'

export default {
  name: 'play',
  aliases: ['p', 'pl'],
  djOnly: true,
  cooldown: 2,
  execute: async ({ guild, voice, text, client, args, captcha, respond, send, meta }) => {
    if (!voice) return respond({ embeds: [generateErrorMessage('Необходимо находиться в голосовом канале.')], ephemeral: true })

    if (!args.length) return respond({ embeds: [generateErrorMessage('Вставьте после команды ссылку на плейлист или альбом, ID пользователя или трека.')], ephemeral: true })

    const permissions = voice.permissionsFor(client.user)
    if (!permissions.has('CONNECT') || !permissions.has('SPEAK') || !permissions.has('VIEW_CHANNEL')) {
      return respond({ embeds: [generateErrorMessage('Мне нужны права, чтобы войти в канал.')], ephemeral: true })
    }

    const player = client.manager.create({
      guild: guild.id,
      voiceChannel: voice.id,
      textChannel: text.id,
      selfDeafen: true
    })

    if (player.state !== 'CONNECTED') player.connect()

    if (!player.voiceChannel) {
      player.setVoiceChannel(voice.id)
      player.connect()
    }

    logger.log('info', 'player info: %s %O %O', player.guild, player.voiceChannel, player.state, meta)
    //if (channel.id !== player.voiceChannel) return message.reply("вы находитесь не в том голосовом канале.")

    // сброс таймера и снятие с паузы при добавлении в очередь
    if (player.paused) player.pause(false)
    if (client.timers.has(guild.id))
      clearTimeout(client.timers.get(guild.id))

    const search = args.join(' ')

    const count = args[1] ?? 10
    let offset = args[2] ?? 1
    offset--

    const arg = detectArgType(args[0])
    let req

    const query = {}

    if (captcha) {
      query.captcha_id = captcha.sid
      query.captcha_key = captcha.captcha_key,
      query.captcha_index = captcha.index
    }

    switch (arg.type) {
      case 'track':
        req = await VK.GetOne({
          q: search,

          ...query
        })
        break
      case 'playlist':
        req = await VK.GetPlaylist({
          owner_id: arg.parsedURL.id.split('_')[0],
          album_id: arg.parsedURL.id.split('_')[1],
          count,
          offset,
          access_key: arg.parsedURL.access_key,

          ...query
        })
        break
      case 'group':
      case 'user':
        req = await VK.GetUser({
          owner_id: arg.id,
          count,
          offset,

          ...query
        })
        break
    }

    if (arg.type === 'unknown') {
      respond({embeds: [generateErrorMessage('Неизвестный тип ссылки', 'error')]})
      return
    }

    if (req.status === 'error') {
      logger.log('warn', 'VK Request error: %O', req, meta)
      if (req.type === 'captcha') {
        client.captcha.set(guild.id, {
          args,
          url: req.error.captcha_img,
          sid: req.error.captcha_id,
          index: req.error.captcha_index
        })

        const captcha = client.captcha.get(guild.id)
        const embed = {
          description: 'Ошибка! Требуется капча. Введите команду `/captcha`, а после код с картинки.' +
          `Если картинки не видно, перейдите по [ссылке](${captcha.url})`,
          color: 0x5181b8,
          image: {
            url: captcha.url + generateRandomCaptchaString()
          }
        }

        return respond({ embeds: [embed], ephemeral: true })
      } else if (req.type === 'empty') {
        return respond({ embeds: [generateErrorMessage('Не удалось ничего найти по запросу или плейлиста не существует.')], ephemeral: true })
      } else if (req.type === 'api') {
        return respond({ embeds: [generateErrorMessage('Неверный формат ссылки или запроса.')], ephemeral: true })
      } else if (req.type === 'request') {
        return respond({ embeds: [generateErrorMessage('Ошибка запроса к серверам ВК.')], ephemeral: true })
      } else if (req.type === 'access_denied') {
        if (arg.type === 'playlist')
          return respond({ embeds: [generateErrorMessage('Нет доступа к плейлисту. Попробуйте получить ссылку по [гайду](https://vk.com/@vkmusicbotds-kak-poluchit-rabochuu-ssylku-na-pleilist).')], ephemeral: true })
        else if (arg.type === 'user')
          return respond({ embeds: [generateErrorMessage('Нет доступа к аудио пользователя. Аудио должны быть открыты.')], ephemeral: true })
      }
    }

    let wrongTracks = []

    if (arg.type === 'track') {
      const songEmbed = {
        color: 0x5181b8,
        title: escapeFormat(req.title),
        author: {
          name: 'Трек добавлен!'
        },
        thumbnail: {
          url: req.thumb
        },
        description: escapeFormat(req.author),
        fields: [
          {
            name: 'Длительность',
            value: Duration.fromObject({seconds: req.duration}).toFormat('mm:ss')
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
        return respond({embeds: [generateErrorMessage(err.message)], ephemeral: true })
      }

      switch (res.loadType) {
        case 'NO_MATCHES':
          if (!player.queue.current) player.destroy()
          return respond({ embeds: [generateErrorMessage('Неизвестная ошибка.')], ephemeral: true })
        case 'TRACK_LOADED':
          res.tracks[0].title = req.title
          res.tracks[0].author = req.author

          player.queue.add(res.tracks[0])
  
          if (!player.playing && !player.paused && !player.queue.size) player.play()
      }

      respond({ embeds: [songEmbed] })
    } else if (arg.type === 'playlist') {
      const newArray = req.newArray

      const playlistEmbed = {
        title: escapeFormat(req.info.title),
        description: escapeFormat(req.info.description),
        color: 0x5181b8,
        thumbnail: {
          url: req.info.imgUrl
        },
        author: {
          name: 'Добавлены треки из плейлиста'
        },
        fields: [
          {
            name: 'Добавлено треков',
            value: newArray.length.toString(),
            inline: true
          },
          {
            name: 'Всего треков',
            value: req.info.count.toString(),
            inline: true
          }
        ],
        footer: {
          text: 'Чтобы добавить больше 10 треков, введите количество треков после ссылки.'
        }
      }

      for await (const e of newArray) {
        if (!e.url) {
          wrongTracks.push(e)
          continue
        }

        const unresolvedTrack = TrackUtils.buildUnresolvedQuery(e.url)

        unresolvedTrack.title = e.title
        unresolvedTrack.author = e.author

        player.queue.add(unresolvedTrack)
        if (!player.playing && !player.paused && !player.queue.size) player.play()
      }

      respond({ embeds: [playlistEmbed] })
    } else if (arg.type === 'user') {
      const newArray = req.newArray

      const playlistEmbed = {
        title: escapeFormat(req.info.name),
        thumbnail: {
          url: req.info.img
        },
        color: 0x5181b8,
        author: {
          name: 'Добавлены треки пользователя'
        },
        fields: [
          {
            name: 'Добавлено треков',
            value: newArray.length.toString(),
            inline: true
          }
        ],
        footer: {
          text: 'Чтобы добавить больше 10 треков, введите количество треков после ссылки.'
        }
      }

      for await (const e of newArray) {
        if (!e.url) {
          wrongTracks.push(e)
          continue
        }
        const unresolvedTrack = TrackUtils.buildUnresolvedQuery(e.url)

        unresolvedTrack.title = e.title
        unresolvedTrack.author = e.author

        player.queue.add(unresolvedTrack)
        if (!player.playing && !player.paused && !player.queue.size) player.play()
      }

      respond({ embeds: [playlistEmbed] })
    } else if (arg.type === 'group') {
      const newArray = req.newArray

      const playlistEmbed = {
        title: escapeFormat(req.info.name),
        description: escapeFormat(req.info.description),
        thumbnail: {
          url: req.info.img
        },
        color: 0x5181b8,
        author: {
          name: 'Добавлены треки из сообщества'
        },
        fields: [
          {
            name: 'Добавлено треков',
            value: newArray.length.toString(),
            inline: true
          }
        ],
        footer: {
          text: 'Чтобы добавить больше 10 треков, введите количество треков после ссылки.'
        }
      }

      for await (const e of newArray) {
        const unresolvedTrack = TrackUtils.buildUnresolvedQuery(e.url)

        unresolvedTrack.title = e.title
        unresolvedTrack.author = e.author

        player.queue.add(unresolvedTrack)
        if (!player.playing && !player.paused && !player.queue.size) player.play()
      }

      respond({ embeds: [playlistEmbed] })
    }

    if (wrongTracks.length > 0) {
      let desc = wrongTracks.slice(0, 5).map(e => {
        return escapeFormat(`${e.author} - ${e.title}`)
      }).join('\n')

      desc = `${desc}\n${wrongTracks.length > 5 ? `...\nи еще ${wrongTracks.length - 5} ${declOfNum(wrongTracks.length - 5, ['трек', 'трека', 'треков'])}.` : ''}`

      send({embeds: [{
        color: 0x5181b8,
        author: {
          name: 'Следующие треки не могут быть добавлены из-за решения автора или представителя'
        },
        description: desc
      }]}, 30000)
    }

    if (!await client.db.checkPremium(guild.id)) {
      if (player)
        if (player.queue.totalSize >= 200) {
          player.queue.remove(199, player.queue.totalSize - 1)
          return send({embeds: [generateErrorMessage('В очереди было больше 200 треков, поэтому лишние треки были удалены. ' +
          `Хотите больше треков? Приобретите Премиум, подробности: \`${client.db.getPrefix(guild.id)}donate\`.`, 'warning')]})
        }
          
    }
  }
}