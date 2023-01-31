import { CommandExecuteParams } from '../slashCommandManager.js'
import Utils, { ErrorMessageType } from '../utils.js'
import { EmbedBuilder, PermissionsBitField, User } from 'discord.js'
import logger from '../logger.js'
import VK, { APIResponse, GroupInfo, OneTrackResponse, PlaylistResponse, UserResponse } from '../apis/VK.js'
import { KazagumoTrack } from 'kazagumo'
import { RawTrack } from 'kazagumo/dist/Modules/Interfaces.js'
import CustomPlayer from '../kazagumo/CustomPlayer.js'
import { getConfig } from '../db.js'

async function fillQueue(newArray: OneTrackResponse[], player: CustomPlayer, wrongTracks: OneTrackResponse[]) {
  for await (const e of newArray) {
    if (!e.url || e.duration > 1800) {
      wrongTracks.push(e)
      continue
    }

    const unresolvedTrack = new KazagumoTrack({ info: {} } as RawTrack, undefined)

    unresolvedTrack.uri = e.url
    unresolvedTrack.title = e.title
    unresolvedTrack.author = e.author
    unresolvedTrack.thumbnail = e.thumb

    player.queue.add(unresolvedTrack)
    if (!player.playing && !player.paused && !player.queue.size) await player.play()
  }
}

export async function playCommand(
  params: CommandExecuteParams,
  queryParam: string,
  countParam?: number | null,
  offsetParam?: number | null
) {
  const { guild, voice, text, client, captcha, respond, send, meta } = params

  if (!voice)
    return respond({
      embeds: [Utils.generateErrorMessage('Необходимо находиться в голосовом канале.')],
      ephemeral: true
    })

  const permissions = voice.permissionsFor(client.user as User)
  if (
    !permissions?.has([
      PermissionsBitField.Flags.Speak,
      PermissionsBitField.Flags.Connect,
      PermissionsBitField.Flags.ViewChannel
    ])
  ) {
    return respond({
      embeds: [Utils.generateErrorMessage('Мне нужны права, чтобы войти в канал.')],
      ephemeral: true
    })
  }

  const player = await client.kazagumo.createPlayer<CustomPlayer>({
    guildId: guild.id,
    voiceId: voice.id,
    textId: text.id,
    deaf: true,
    shardId: guild.shardId,
    loadBalancer: false
  })

  logger.info(
    {
      guild_id: player.guildId,
      voice: player.voiceId,
      state: player.state,
      ...meta
    },
    'Player created'
  )
  //if (channel.id !== player.voiceChannel) return message.reply("вы находитесь не в том голосовом канале.")

  // сброс таймера и снятие с паузы при добавлении в очередь
  if (player.paused) player.pause(false)

  const timer = client.timers.get(guild.id)
  if (timer) clearTimeout(timer)

  const search = queryParam.trim()

  const count = countParam ?? 10
  const offset = offsetParam ?? 1
  //offset--

  const arg = Utils.detectArgType(search)
  let req

  const query: any = {}

  if (captcha) {
    query.captcha_id = captcha.sid
    query.captcha_key = captcha.captcha_key
    query.captcha_index = captcha.index
  }

  switch (arg.type) {
    case 'track':
      req = await VK.getOne({
        q: arg.query,

        ...query
      })
      break
    case 'playlist':
      req = await VK.getPlaylist({
        owner_id: arg.owner_id,
        album_id: arg.id,
        count,
        offset,
        access_key: arg.access_key,

        ...query
      })
      break
    case 'group':
    case 'user':
      req = await VK.getUser({
        owner_id: arg.owner_id,
        count,
        offset,

        ...query
      })
      break
  }

  if (arg.type === 'unknown') {
    await respond({
      embeds: [Utils.generateErrorMessage('Неизвестный тип ссылки', ErrorMessageType.Error)]
    })
    return
  }

  if (!req) return

  if (req.status === 'error') {
    logger.warn({ req, ...meta }, 'VK Request error')

    const reqError = req as APIResponse

    if (reqError.type === 'captcha') {
      client.captcha.set(guild.id, {
        type: 'play',
        query: queryParam,
        count: countParam,
        offset: offsetParam,
        url: reqError.error.captcha_img,
        sid: reqError.error.captcha_id,
        index: reqError.error.captcha_index
      })

      const captcha = client.captcha.get(guild.id)

      const embed = {
        description:
          'Ошибка! Требуется капча. Введите команду `/captcha`, а после код с картинки.' +
          `Если картинки не видно, перейдите по [ссылке](${captcha?.url})`,
        color: 0x5181b8,
        image: {
          url: captcha?.url + Utils.generateRandomCaptchaString()
        }
      }

      await respond({ embeds: [embed], ephemeral: true })
    } else if (reqError.type === 'empty') {
      await respond({
        embeds: [Utils.generateErrorMessage('Не удалось ничего найти по запросу или плейлиста не существует.')],
        ephemeral: true
      })
    } else if (reqError.type === 'api') {
      await respond({
        embeds: [Utils.generateErrorMessage('Неверный формат ссылки или запроса.')],
        ephemeral: true
      })
    } else if (reqError.type === 'request') {
      await respond({
        embeds: [Utils.generateErrorMessage('Ошибка запроса к серверам ВК.')],
        ephemeral: true
      })
    } else if (reqError.type === 'access_denied') {
      if (arg.type === 'playlist') {
        await respond({
          embeds: [
            Utils.generateErrorMessage(
              'Нет доступа к плейлисту. Попробуйте получить ссылку по [гайду](https://vk.com/@vkmusicbotds-kak-poluchit-rabochuu-ssylku-na-pleilist).'
            )
          ],
          ephemeral: true
        })
      } else if (arg.type === 'user') {
        await respond({
          embeds: [Utils.generateErrorMessage('Нет доступа к аудио пользователя. Аудио должны быть открыты.')],
          ephemeral: true
        })
      }
    }
    return
  }

  const wrongTracks: OneTrackResponse[] = []

  if (arg.type === 'track') {
    req = req as OneTrackResponse

    if (req.duration > 1800) {
      await respond({
        embeds: [Utils.generateErrorMessage('Нельзя добавлять треки длиннее 30 минут.')],
        ephemeral: true
      })
      return
    }

    const songEmbed = new EmbedBuilder()
      .setTitle(Utils.escapeFormat(req.title))
      .setURL(Utils.generateTrackUrl(req.id, req.access_key))
      .setColor(0x5181b8)
      .setAuthor({
        name: 'Трек добавлен!'
      })
      .setDescription(Utils.escapeFormat(req.author))
      .addFields([
        {
          name: 'Длительность',
          value: Utils.formatTime(req.duration)
        }
      ])

    if (req.thumb) songEmbed.setThumbnail(req.thumb)

    let res

    try {
      res = await player.search(req.url)

      if (!res.tracks.length) {
        logger.error({ ...meta }, 'LOAD_FAILED')
        if (!player.queue.current) player.destroy()
        await respond({
          embeds: [Utils.generateErrorMessage('Ошибка загрузки.')],
          ephemeral: true
        })
        return
      }
    } catch (err: any) {
      logger.error({ err, ...meta }, 'Play error')
      await respond({
        embeds: [Utils.generateErrorMessage('Ошибка отправки запроса на стороне бота. Свяжитесь с поддержкой.')],
        ephemeral: true
      })
      return
    }

    switch (res.type) {
      case 'TRACK':
        res.tracks[0].title = req.title
        res.tracks[0].author = req.author
        res.tracks[0].thumbnail = req.thumb

        player.queue.add(res.tracks[0])

        // TODO: check if size check is needed
        if (!player.playing && !player.paused && !player.queue.size) await player.play()
    }

    await respond({ embeds: [songEmbed] })
  } else if (arg.type === 'playlist') {
    req = req as PlaylistResponse

    const newArray = req.newArray

    const playlistEmbed = new EmbedBuilder()
      .setTitle(Utils.escapeFormat(req.info.title))
      .setDescription(Utils.escapeFormat(req.info.description))
      .setColor(0x5181b8)
      .setAuthor({ name: 'Добавлены треки из плейлиста' })
      .addFields([
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
      ])
      .setFooter({
        text: 'Чтобы добавить больше 10 треков, введите количество треков в аргумент "количество".'
      })

    await fillQueue(newArray, player, wrongTracks)

    await respond({ embeds: [playlistEmbed] })
  } else if (arg.type === 'user') {
    req = req as UserResponse

    const newArray = req.newArray

    const playlistEmbed = new EmbedBuilder()
      .setTitle(Utils.escapeFormat(req.info.name))
      .setColor(0x5181b8)
      .setAuthor({
        name: 'Добавлены треки пользователя'
      })
      .addFields([
        {
          name: 'Добавлено треков',
          value: newArray.length.toString(),
          inline: true
        }
      ])
      .setFooter({
        text: 'Чтобы добавить больше 10 треков, введите количество треков в аргумент "количество".'
      })

    await fillQueue(newArray, player, wrongTracks)

    await respond({ embeds: [playlistEmbed] })
  } else if (arg.type === 'group') {
    req = req as UserResponse
    const newArray = req.newArray

    const playlistEmbed = new EmbedBuilder()
      .setTitle(Utils.escapeFormat(req.info.name))
      .setDescription(Utils.escapeFormat((req.info as GroupInfo).description))
      .setColor(0x5181b8)
      .setAuthor({
        name: 'Добавлены треки из сообщества'
      })
      .addFields([
        {
          name: 'Добавлено треков',
          value: newArray.length.toString(),
          inline: true
        }
      ])
      .setFooter({
        text: 'Чтобы добавить больше 10 треков, введите количество треков в аргумент `количество`.'
      })

    await fillQueue(newArray, player, wrongTracks)

    await respond({ embeds: [playlistEmbed] })
  }

  if (wrongTracks.length > 0) {
    let desc = wrongTracks
      .slice(0, 5)
      .map((e) => {
        return Utils.escapeFormat(`${e.author} - ${e.title}`)
      })
      .join('\n')

    desc = `${desc}\n${
      wrongTracks.length > 5
        ? `...\nи еще ${wrongTracks.length - 5} ${Utils.declOfNum(wrongTracks.length - 5, [
            'трек',
            'трека',
            'треков'
          ])}.`
        : ''
    }`

    await send(
      {
        embeds: [
          {
            color: 0x5181b8,
            author: {
              name: 'Следующие треки не могут быть добавлены из-за решения автора или представителя'
            },
            description: desc
          }
        ]
      },
      30000
    )
  }

  const config = await getConfig(guild.id)

  if (!config.premium) {
    if (player)
      if (player.queue.totalSize > 200) {
        player.queue.length = 200
        await send({
          embeds: [
            Utils.generateErrorMessage(
              'В очереди было больше 200 треков, поэтому лишние треки были удалены. ' +
                'Хотите больше треков? Приобретите Премиум, подробности: `/donate`.',
              ErrorMessageType.Warning
            )
          ]
        })
      }
  }
}
