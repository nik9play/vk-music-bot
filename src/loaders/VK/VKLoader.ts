import BotTrack from '../../structures/botTrack.js'
import BaseLoader, { CaptchaInfo, CaptchaLoaderError, LoaderError } from '../baseLoader.js'
import { fetch } from 'undici'
import { EmbedBuilder } from 'discord.js'
import {
  VKErrorCode,
  VKErrorResponse,
  VKGroupResponse,
  VKPlaylistResponse,
  VKTrack,
  VKUserResponse,
  isVKErrorResponse
} from './VKTypes.js'
import Utils from '../../utils.js'
import { VkMusicBotClient } from '../../client.js'
import logger from '../../logger.js'
import { ENV } from '../../modules/env.js'

export default class VKLoader implements BaseLoader {
  public get name() {
    return 'vk'
  }

  public get displayName() {
    return 'ВКонтакте'
  }

  public get color() {
    return 0x0076fe
  }

  public get iconURL() {
    return 'https://raw.githubusercontent.com/nik9play/vkmusicbot-resources/main/VK.png'
  }

  public get emoji() {
    return '<:vkicon:1134502342914478212>'
  }

  private url: string
  private token: string
  public client: VkMusicBotClient

  constructor(client: VkMusicBotClient) {
    this.client = client
    this.url = ENV.VK_PROXY_URL
    this.token = ENV.VK_PROXY_TOKEN
  }

  private requestErrorMessage =
    'Ошибка запроса к серверам бота. Обратитесь за поддержкой в [группу ВК](https://vk.com/vkmusicbotds) или на [сервер Discord](https://discord.com/invite/3ts2znePu7).'

  private playlistRegex =
    /https?:\/\/.*(audio_playlist|\/music\/(playlist|album)\/)(?<owner_id>-?\d+)[_|/](?<id>\d+)((_|\/|&access_key=)(?<access_key>[a-zA-Z0-9]+))?/

  private trackRegex =
    /(?:^|^https?:\/\/.*\/audio)(?<owner_id>-?\d+)_(?<id>\d+)(?:_(?<access_key>[a-zA-Z0-9]+))?$/

  private userGroupRegex =
    /^>(?:(?<group_id>-[0-9]+)|(?<user_id>[0-9]+)|(?<screen_name>[A-Za-z0-9._]+))$/

  private userGroupNumberUrlRegex = /^https:\/\/vk\.com\/(audios(?<owner_id>-?\d+))$/

  private userGroupTextUrlRegex = /^https:\/\/vk\.com\/(?<screen_name>[a-zA-Z0-9._]+)$/

  private prepareParams(
    params: Record<string, string | number | undefined | null>
  ): Record<string, string | number> {
    return Object.fromEntries(
      Object.entries(params).filter(([, value]) => value !== null && value !== undefined)
    ) as Record<string, string | number>
  }

  private async makeRequest<T>(
    path: string,
    params: Record<string, string | number | undefined | null>
  ): Promise<T | VKErrorResponse> {
    const body = this.prepareParams(params)

    const response = await fetch(`${this.url}/api/raw/${path}`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${this.token}`
      },
      body: JSON.stringify(body)
    })

    if (response.ok) return (await response.json()) as T

    return (await response.json()) as VKErrorResponse
  }

  private getErrorOrThrowCaptcha(error: VKErrorResponse) {
    if (error.code === VKErrorCode.CAPTCHA) {
      throw new CaptchaLoaderError(
        error.captchaSid as number,
        error.captchaImg as string,
        error.captchaIndex
      )
    }

    return error
  }

  private getTrackUrl(
    url: string,
    ownerId: number,
    id: number,
    duration: number,
    accessKey?: string
  ): string {
    const params = new URLSearchParams({
      url,
      ownerId: ownerId.toString(),
      id: id.toString(),
      duration: duration.toString()
    })

    if (accessKey) params.append('accessKey', accessKey)

    return `${this.url}/stream?${params}`
  }

  private convertToBotTracks(tracks: VKTrack[], wrongTrackNames: string[]) {
    return tracks
      .filter((e) => {
        if (!e.url || e.duration > 1.5 * 60 * 60) {
          wrongTrackNames.push(`${e.artist} – ${e.title}`)
          return false
        } else {
          return true
        }
      })
      .map((e) => {
        const unresolvedTrack = new BotTrack(
          this.name,
          undefined,
          this.getTrackUrl(e.url, e.owner_id, e.id, e.duration, e.access_key),
          {
            author: e.artist,
            title: e.title,
            thumb: e.album?.thumb?.photo_300,
            duration: e.duration,
            id: e.id,
            ownerId: e.owner_id,
            accessKey: e.access_key
          }
        )

        return unresolvedTrack
      })
  }

  public checkQuery(query: string): boolean {
    return (
      this.userGroupNumberUrlRegex.test(query) ||
      this.userGroupTextUrlRegex.test(query) ||
      this.userGroupRegex.test(query) ||
      this.trackRegex.test(query) ||
      this.playlistRegex.test(query)
    )
  }

  public async resolveTracks(
    query: string,
    count?: number | null,
    offset?: number | null,
    captcha?: CaptchaInfo
  ): Promise<[BotTrack[], EmbedBuilder, string[]]> {
    count = count ?? 50
    offset = offset ?? 1
    offset--

    const countQuery = Math.ceil(count / 50) * 50

    const captchaInfo = {
      captcha_sid: captcha?.sid,
      captcha_key: captcha?.key,
      captcha_index: captcha?.index
    }

    // let tracks: BotTrack[]
    // let wrongTracks: string[]
    // let embed: EmbedBuilder

    const playlistMatch = query.match(this.playlistRegex)

    if (playlistMatch && playlistMatch.groups) {
      const urlParams = {
        id: playlistMatch.groups['id'],
        owner_id: playlistMatch.groups['owner_id'],
        access_key: playlistMatch.groups['access_key'],
        need_playlist: 1,
        audio_count: countQuery,
        audio_offset: offset,
        ...captchaInfo
      }

      const response = await this.makeRequest<VKPlaylistResponse>('execute.getPlaylist', urlParams)

      if (isVKErrorResponse(response)) {
        const error = this.getErrorOrThrowCaptcha(response)

        switch (error.code) {
          case VKErrorCode.ACCESS_DENIED:
          case VKErrorCode.ACCESS_DENIED_ALBUM:
          case VKErrorCode.ACCESS_DENIED_AUDIO:
            throw new LoaderError(
              'Нет доступа к плейлисту. Попробуйте получить ссылку по [гайду](https://vk.com/@vkmusicbotds-kak-poluchit-rabochuu-ssylku-na-pleilist).'
            )
          case VKErrorCode.WRONG_USER_ID:
            throw new LoaderError('Не удалось ничего найти по запросу.')
          default:
            throw new LoaderError('Неверный формат ссылки или запроса.')
        }
      }

      if (response.response.audios.length === 0) {
        throw new LoaderError('Плейлист пуст.')
      }

      let description: string | null = Utils.escapeFormat(response.response.playlist.description)
      description = description.length === 0 ? null : description

      const tracks = response.response.audios.slice(0, count)

      const embed = new EmbedBuilder()
        .setTitle(Utils.escapeFormat(response.response.playlist.title).slice(0, 100))
        .setURL(
          `https://vk.com/music/playlist/${response.response.playlist.owner_id}_${
            response.response.playlist.id
          }${
            response.response.playlist.access_key ? '_' + response.response.playlist.access_key : ''
          }`
        )
        .setDescription(description)
        .setColor(this.color)
        .setAuthor({ name: 'Добавлены треки из плейлиста' })
        .addFields([
          {
            name: 'Добавлено треков',
            value: tracks.length.toString(),
            inline: true
          },
          {
            name: 'Всего треков',
            value: response.response.playlist.count.toString(),
            inline: true
          }
        ])
        .setFooter({
          text: 'Чтобы добавить больше 50 треков, введите количество треков в аргумент "количество".'
        })
        .setThumbnail(response.response.playlist.photo?.photo_300 ?? null)

      const wrongTracks: string[] = []
      return [this.convertToBotTracks(tracks, wrongTracks), embed, wrongTracks]
    }

    let groupId: string | null = null
    let userId: string | null = null

    const assignUserAndGroupIds = async (screen_name: string) => {
      const response = await this.makeRequest<{ object_id: number; type: string }>(
        'utils.resolveScreenName',
        {
          screen_name: screen_name
        }
      )

      if (isVKErrorResponse(response)) {
        this.getErrorOrThrowCaptcha(response)

        throw new LoaderError('Неверный формат ссылки или запроса.')
      }

      if (response.type === 'user') {
        userId = response.object_id.toString()
      }

      if (response.type === 'group') {
        groupId = `-${response.object_id.toString()}`
      }
    }

    let oneTrack: VKTrack | null | undefined = null

    const trackMatch = query.match(this.trackRegex)

    if (trackMatch && trackMatch.groups) {
      const id = trackMatch.groups['id']
      const ownerId = trackMatch.groups['owner_id']
      const accessKey = trackMatch.groups['access_key']

      logger.debug(
        { g: trackMatch.groups },
        'audio link' + `${ownerId}_${id}${accessKey ? '_' + accessKey : ''}`
      )

      const response = await this.makeRequest<VKTrack[]>('audio.getById', {
        audios: `${ownerId}_${id}${accessKey ? '_' + accessKey : ''}`,
        ...captchaInfo
      })

      logger.debug({ response })

      if (isVKErrorResponse(response)) {
        this.getErrorOrThrowCaptcha(response)

        throw new LoaderError('Ничего не найдено по запросу.')
      }

      oneTrack = response[0]
    }

    if (!oneTrack) {
      const userGroupMatch = query.match(this.userGroupRegex)

      if (userGroupMatch && userGroupMatch.groups) {
        groupId = userGroupMatch.groups['group_id']
        userId = userGroupMatch.groups['user_id']

        if (userGroupMatch.groups['screen_name']) {
          await assignUserAndGroupIds(userGroupMatch.groups['screen_name'])
        }

        if (!groupId && !userId) {
          throw new LoaderError('Не удалось ничего найти по запросу.')
        }
      }

      const userGroupNumberUrlMatch = query.match(this.userGroupNumberUrlRegex)

      if (userGroupNumberUrlMatch && userGroupNumberUrlMatch.groups) {
        if (userGroupNumberUrlMatch.groups['owner_id'].startsWith('-')) {
          groupId = userGroupNumberUrlMatch.groups['owner_id']
        } else {
          userId = userGroupNumberUrlMatch.groups['owner_id']
        }
      }

      const userGroupTextUrlRegex = query.match(this.userGroupTextUrlRegex)

      if (userGroupTextUrlRegex && userGroupTextUrlRegex.groups) {
        if (userGroupTextUrlRegex.groups['screen_name']) {
          await assignUserAndGroupIds(userGroupTextUrlRegex.groups['screen_name'])
        }

        if (!groupId && !userId) {
          throw new LoaderError('Не удалось ничего найти по запросу.')
        }
      }

      if (groupId) {
        const response = await this.makeRequest<VKGroupResponse>('execute.getMusicPage', {
          owner_id: groupId,
          audio_count: countQuery,
          audio_offset: offset,
          need_owner: '1',
          ...captchaInfo
        })

        if (isVKErrorResponse(response)) {
          const error = this.getErrorOrThrowCaptcha(response)

          switch (error.code) {
            case VKErrorCode.ACCESS_DENIED:
            case VKErrorCode.ACCESS_DENIED_ALBUM:
            case VKErrorCode.ACCESS_DENIED_AUDIO:
              throw new LoaderError('Нет доступа к аудио сообщества.')
            case VKErrorCode.WRONG_USER_ID:
              throw new LoaderError('Не удалось ничего найти по запросу.')
            default:
              throw new LoaderError('Неверный формат ссылки или запроса.')
          }
        }

        if (response.response.audios.items.length === 0) {
          throw new LoaderError('Аудио пусты.')
        }

        const tracks = response.response.audios.items.slice(0, count)

        const embed = new EmbedBuilder()
          .setTitle(Utils.escapeFormat(response.response.owner.name).slice(0, 100))
          .setURL(`https://vk.com/club${response.response.owner.id}`)
          // .setDescription(description)
          .setColor(this.color)
          .setAuthor({
            name: 'Добавлены треки из сообщества'
          })
          .addFields([
            {
              name: 'Добавлено треков',
              value: tracks.length.toString(),
              inline: true
            }
          ])
          .setFooter({
            text: 'Чтобы добавить больше 50 треков, введите количество треков в аргумент "количество".'
          })
          .setThumbnail(response.response.owner.photo_200 ?? null)

        const wrongTracks: string[] = []
        return [this.convertToBotTracks(tracks, wrongTracks), embed, wrongTracks]
      } else if (userId) {
        const response = await this.makeRequest<VKUserResponse>('execute.getMusicPage', {
          owner_id: userId,
          audio_count: countQuery,
          audio_offset: offset,
          need_owner: '1',
          ...captchaInfo
        })

        if (isVKErrorResponse(response)) {
          const error = this.getErrorOrThrowCaptcha(response)

          switch (error.code) {
            case VKErrorCode.ACCESS_DENIED:
            case VKErrorCode.ACCESS_DENIED_ALBUM:
            case VKErrorCode.ACCESS_DENIED_AUDIO:
              throw new LoaderError(
                'Нет доступа к аудио пользователя. Профиль и доступ к аудиозаписям должен быть открыт в [настройках приватности](https://vk.com/settings?act=privacy).'
              )
            case VKErrorCode.WRONG_USER_ID:
              throw new LoaderError('Не удалось ничего найти по запросу.')
            default:
              throw new LoaderError('Неверный формат ссылки или запроса.')
          }
        }

        if (response.response.audios.items.length === 0) {
          throw new LoaderError('Аудио пусты.')
        }

        const tracks = response.response.audios.items.slice(0, count)

        const embed = new EmbedBuilder()
          .setTitle(
            Utils.escapeFormat(
              `${response.response.owner.first_name} ${response.response.owner.last_name}`
            ).slice(0, 100)
          )
          .setURL(`https://vk.com/id${response.response.owner.id}`)
          .setColor(this.color)
          .setAuthor({
            name: 'Добавлены треки пользователя'
          })
          .addFields([
            {
              name: 'Добавлено треков',
              value: tracks.length.toString(),
              inline: true
            }
          ])
          .setFooter({
            text: 'Чтобы добавить больше 50 треков, введите количество треков в аргумент "количество".'
          })
          .setThumbnail(response.response.owner.photo_200 ?? null)

        const wrongTracks: string[] = []
        return [this.convertToBotTracks(tracks, wrongTracks), embed, wrongTracks]
      }

      // попытка поиска трека по названию
      const response = await this.makeRequest<{ count: number; items: VKTrack[] }>('audio.search', {
        q: Utils.escapeQuery(query),
        count: 1,
        ...captchaInfo
      })

      if (isVKErrorResponse(response)) {
        this.getErrorOrThrowCaptcha(response)

        throw new LoaderError('Ничего не найдено по запросу.')
      }

      oneTrack = response.items[0] as VKTrack | undefined

      // logger.info({ q: Utils.escapeQuery(query), oneTrack }, 'test query')
    }

    if (!oneTrack) {
      throw new LoaderError('Не удалось ничего найти по запросу.')
    }

    const embed = new EmbedBuilder()
      .setTitle(Utils.escapeFormat(oneTrack.title).slice(0, 256))
      .setURL(Utils.generateTrackUrl(`${oneTrack.owner_id}_${oneTrack.id}`, oneTrack.access_key))
      .setColor(this.color)
      .setAuthor({
        name: 'Трек добавлен!'
      })
      .setDescription(Utils.escapeFormat(oneTrack.artist))
      .addFields([
        {
          name: 'Длительность',
          value: Utils.formatTime(oneTrack.duration * 1000)
        }
      ])
      .setThumbnail(oneTrack.album?.thumb?.photo_300 ?? null)

    const wrongTracks: string[] = []
    return [this.convertToBotTracks([oneTrack], wrongTracks), embed, wrongTracks]
  }

  public async resolveSearchResults(
    query: string,
    count: number,
    captcha?: CaptchaInfo | undefined
  ): Promise<BotTrack[]> {
    const captchaInfo = {
      captcha_sid: captcha?.sid,
      captcha_key: captcha?.key,
      captcha_index: captcha?.index
    }

    const response = await this.makeRequest<{ count: number; items: VKTrack[] }>('audio.search', {
      q: Utils.escapeQuery(query),
      count,
      ...captchaInfo
    })

    if (isVKErrorResponse(response)) {
      this.getErrorOrThrowCaptcha(response)

      throw new LoaderError('Ничего не найдено по запросу.')
    }

    const tracks = response.items

    if (tracks.length === 0) {
      throw new LoaderError('Ничего не найдено по запросу.')
    }

    return this.convertToBotTracks(tracks, [])
  }
}
