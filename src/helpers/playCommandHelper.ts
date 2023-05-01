import Utils, { ErrorMessageType } from '../utils.js'
import {
  ActionRowBuilder,
  ButtonBuilder,
  ButtonStyle,
  EmbedBuilder,
  Guild,
  PermissionsBitField,
  User
} from 'discord.js'
import logger from '../logger.js'
import VK, { APIResponse, GroupInfo, OneTrackResponse, PlaylistResponse, UserResponse } from '../apis/VK.js'
import { getConfig } from '../db.js'
import BotTrack from '../structures/botTrack.js'
import { VkMusicBotClient } from '../client.js'
import { Node } from 'shoukaku'
import BotPlayer from '../modules/botPlayer.js'
import { CommandExecuteParams } from '../interactions/commandInteractions.js'

async function fillQueue(
  trackResponses: OneTrackResponse[],
  client: VkMusicBotClient,
  guild: Guild,
  voiceChannelId: string,
  textChannelId: string,
  node: Node,
  wrongTracks: OneTrackResponse[]
) {
  const tracks: BotTrack[] = trackResponses
    .filter((e) => {
      if (!e.url || e.duration > 1800) {
        wrongTracks.push(e)
        return false
      } else {
        return true
      }
    })
    .map((e) => {
      const unresolvedTrack = new BotTrack(undefined, e.url, {
        author: e.author,
        title: e.title,
        thumb: e.thumb,
        duration: e.duration
      })

      return unresolvedTrack
    })

  const result = await client.playerManager.handle(guild, voiceChannelId, textChannelId, node, tracks)
  if (result instanceof BotPlayer) {
    result.play()
  }
  return result
}

export async function playCommandHandler(
  params: CommandExecuteParams,
  queryParam: string,
  countParam?: number | null,
  offsetParam?: number | null
) {
  const { guild, voice, text, client, captcha, respond, send, meta } = params

  if (!voice) {
    respond({
      embeds: [Utils.generateErrorMessage('Необходимо находиться в голосовом канале.')],
      ephemeral: true
    })
    return
  }

  const permissions = voice.permissionsFor(client.user as User)
  if (
    !permissions?.has([
      PermissionsBitField.Flags.Speak,
      PermissionsBitField.Flags.Connect,
      PermissionsBitField.Flags.ViewChannel
    ])
  ) {
    respond({
      embeds: [Utils.generateErrorMessage('Мне нужны права, чтобы войти в канал.')],
      ephemeral: true
    })
    return
  }

  const node = client.shoukaku.getNode('auto')

  if (!node) {
    respond({
      embeds: [
        Utils.generateErrorMessage(
          'Нет доступных серверов для воспроизведения. Попробуйте еще раз через несколько минут, если не сработает, обратитесь за ' +
            'поддержкой в [группу ВК](https://vk.com/vkmusicbotds) или [сервер Discord](https://discord.com/invite/3ts2znePu7).'
        )
      ],
      ephemeral: true
    })
    return
  }

  Utils.clearExitTimeout(guild.id, client)

  const search = queryParam.trim()

  const count = countParam ?? 50
  let offset = offsetParam ?? 1
  offset--

  const countQuery = Math.ceil(count / 50) * 50

  const arg = Utils.detectQueryType(search)
  logger.debug({ arg })
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
        count: countQuery,
        offset,
        access_key: arg.access_key,

        ...query
      })
      break
    case 'group':
    case 'user':
      req = await VK.getUser({
        owner_id: arg.owner_id,
        count: countQuery,
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

  logger.debug({ req })

  if (req.status === 'error') {
    logger.warn({ req, ...meta }, 'VK Request error')

    const errorTimeout = 30_000

    const reqError = req as APIResponse

    if (reqError.type === 'captcha') {
      const captchaError = await Utils.handleCaptchaError(
        {
          type: 'play',
          query: queryParam,
          count: countParam,
          offset: offsetParam,
          url: reqError.error.captcha_img,
          sid: reqError.error.captcha_id,
          index: reqError.error.captcha_index
        },
        params,
        !captcha
      )
      if (captchaError) {
        await respond(captchaError)
      }
      return
    } else if (reqError.type === 'empty') {
      await respond(
        {
          embeds: [Utils.generateErrorMessage('Не удалось ничего найти по запросу или плейлиста не существует.')]
        },
        errorTimeout
      )
    } else if (reqError.type === 'api') {
      await respond(
        {
          embeds: [Utils.generateErrorMessage('Неверный формат ссылки или запроса.')]
        },
        errorTimeout
      )
    } else if (reqError.type === 'request' && arg.type === 'user') {
      await respond(
        {
          embeds: [
            Utils.generateErrorMessage(
              'Возможно, такого пользователя не существует. Попробуйте добавить треки по числовому ID.'
            )
          ]
        },
        errorTimeout
      )
    } else if (reqError.type === 'request') {
      await respond(
        {
          embeds: [
            Utils.generateErrorMessage(
              'Ошибка запроса к серверам бота. Обратитесь за поддержкой в [группу ВК](https://vk.com/vkmusicbotds) или на [сервер Discord](https://discord.com/invite/3ts2znePu7).'
            )
          ]
        },
        errorTimeout
      )
    } else if (reqError.type === 'access_denied') {
      if (arg.type === 'playlist') {
        await respond(
          {
            embeds: [
              Utils.generateErrorMessage(
                'Нет доступа к плейлисту. Попробуйте получить ссылку по [гайду](https://vk.com/@vkmusicbotds-kak-poluchit-rabochuu-ssylku-na-pleilist).'
              )
            ]
          },
          errorTimeout
        )
      } else if (arg.type === 'user') {
        await respond(
          {
            embeds: [Utils.generateErrorMessage('Нет доступа к аудио пользователя. Аудио должны быть открыты.')]
          },
          errorTimeout
        )
      }
    }
    return
  }

  let player: BotPlayer | 'Busy' | null = null
  const wrongTracks: OneTrackResponse[] = []

  if (arg.type === 'track') {
    req = req as OneTrackResponse

    if (req.duration > 1800) {
      await respond(
        {
          embeds: [Utils.generateErrorMessage('Нельзя добавлять треки длиннее 30 минут.')]
        },
        15_000
      )
      return
    }

    const songEmbed = new EmbedBuilder()
      .setTitle(Utils.escapeFormat(req.title).slice(0, 256))
      .setURL(Utils.generateTrackUrl(req.id, req.access_key))
      .setColor(0x5181b8)
      .setAuthor({
        name: 'Трек добавлен!'
      })
      .setDescription(Utils.escapeFormat(req.author))
      .addFields([
        {
          name: 'Длительность',
          value: Utils.formatTime(req.duration * 1000)
        }
      ])

    if (req.thumb) songEmbed.setThumbnail(req.thumb)

    player = await fillQueue([req], client, guild, voice.id, text.id, node, wrongTracks)

    const components = [
      new ActionRowBuilder<ButtonBuilder>().addComponents([
        new ButtonBuilder()
          .setCustomId(`playTrack,${req.id}${req.access_key ? '_' + req.access_key : ''}`)
          .setLabel('Добавить еще раз')
          .setStyle(ButtonStyle.Primary)
      ])
    ]

    await respond({ embeds: [songEmbed], components })
  } else if (arg.type === 'playlist') {
    req = req as PlaylistResponse

    const newArray = req.newArray.slice(0, count)

    let description: string | null = Utils.escapeFormat(req.info.description)
    description = description.length === 0 ? null : description

    const playlistEmbed = new EmbedBuilder()
      .setTitle(Utils.escapeFormat(req.info.title).slice(0, 100))
      .setURL(`https://vk.com/music/playlist/${arg.owner_id}_${arg.id}${arg.access_key ? '_' + arg.access_key : ''}`)
      .setDescription(description)
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
      .setThumbnail(req.info.imgUrl ?? null)

    player = await fillQueue(newArray, client, guild, voice.id, text.id, node, wrongTracks)

    await respond({ embeds: [playlistEmbed] })
  } else if (arg.type === 'user') {
    req = req as UserResponse

    const newArray = req.newArray.slice(0, count)

    const playlistEmbed = new EmbedBuilder()
      .setTitle(Utils.escapeFormat(req.info.name).slice(0, 100))
      .setURL(`https://vk.com/${arg.owner_id}`)
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
      .setThumbnail(req.info.img ?? null)

    player = await fillQueue(newArray, client, guild, voice.id, text.id, node, wrongTracks)

    await respond({ embeds: [playlistEmbed] })
  } else if (arg.type === 'group') {
    req = req as UserResponse
    const newArray = req.newArray.slice(0, count)

    let description: string | null = Utils.escapeFormat((req.info as GroupInfo).description)
    description = description.length === 0 ? null : description

    const playlistEmbed = new EmbedBuilder()
      .setTitle(Utils.escapeFormat(req.info.name).slice(0, 100))
      .setURL(`https://vk.com/club${arg.owner_id?.slice(1)}`)
      .setDescription(description)
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
        text: 'Чтобы добавить больше 10 треков, введите количество треков в аргумент "количество".'
      })
      .setThumbnail(req.info.img ?? null)

    player = await fillQueue(newArray, client, guild, voice.id, text.id, node, wrongTracks)

    await respond({ embeds: [playlistEmbed] })
  }

  if (wrongTracks.length > 0) {
    let desc = wrongTracks
      .slice(0, 5)
      .map((e) => {
        return Utils.escapeFormat(`${e.author} – ${e.title}`)
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
              name: 'Следующие треки не могут быть добавлены из-за решения автора или представителя, либо они длиннее 30 минут.'
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
    if (player instanceof BotPlayer)
      if (player.queue.length > 200) {
        player.queue.length = 200
        await send({
          embeds: [
            Utils.generateErrorMessage(
              'В очереди было больше 200 треков, поэтому лишние треки были удалены. ' +
                'Хотите больше треков? Приобретите Премиум, подробности: </donate:906533685979918396>.',
              ErrorMessageType.Warning
            )
          ]
        })
      }
  }
}
