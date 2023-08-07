import { VkMusicBotClient } from '../../client.js'
import BaseLoader, { LoaderError } from '../baseLoader.js'
import { EmbedBuilder } from 'discord.js'
import BotTrack from '../../structures/botTrack.js'
import { Track } from 'shoukaku'
import logger from '../../logger.js'
import Utils from '../../utils.js'

export default class YandexMusicLoader implements BaseLoader {
  public get name() {
    return 'ya'
  }

  public get color() {
    return 0xffca00
  }

  public get displayName() {
    return 'Яндекс Музыка'
  }

  public get iconURL() {
    return 'https://raw.githubusercontent.com/nik9play/vkmusicbot-resources/main/YA.png'
  }

  public get emoji() {
    return '<:yandexicon:1134502346328637480>'
  }

  public client: VkMusicBotClient

  private urlRegex =
    /(https?:\/\/)?music\.yandex\.(ru|com)\/(artist|album)\/([0-9]+)\/?((track\/)([0-9]+)\/?)?/
  private urlPlaylistRegex =
    /(https?:\/\/)?music\.yandex\.(ru|com)\/users\/([0-9A-Za-z@.-]+)\/playlists\/([0-9]+)\/?/

  public checkQuery(query: string): boolean {
    return this.urlRegex.test(query) || this.urlPlaylistRegex.test(query)
  }

  constructor(client: VkMusicBotClient) {
    this.client = client
  }

  private convertToBotTracks(tracks: Track[], count: number, offset: number) {
    return tracks.slice(offset, count + offset).map((e) => {
      const unresolvedTrack = new BotTrack(this.name, e)

      return unresolvedTrack
    })
  }

  public async resolveTracks(
    query: string,
    count?: number | null | undefined,
    offset?: number | null | undefined
  ): Promise<[BotTrack[], EmbedBuilder, string[]]> {
    count = count ?? 50
    offset = offset ?? 1
    offset--

    const node = this.client.shoukaku.getIdealNode()

    if (!node) throw new LoaderError('Нет доступных нод.')

    if (!this.checkQuery(query)) query = `ymsearch:${query}`

    const resolvedTracks = await node?.rest.resolve(query)
    logger.debug({ resolvedTracks })
    if (!resolvedTracks) throw new LoaderError('Не удалось ничего найти по запросу.')
    if (resolvedTracks.tracks.length === 0)
      throw new LoaderError('Не удалось ничего найти по запросу.')

    const embed = new EmbedBuilder().setColor(this.color)

    const tracks = this.convertToBotTracks(resolvedTracks.tracks, count, offset)

    switch (resolvedTracks.loadType) {
      case 'NO_MATCHES':
        throw new LoaderError('Не удалось ничего найти по запросу.')
      case 'LOAD_FAILED':
        throw new LoaderError('Произошла неизвестная ошибка загрузки.')
      case 'SEARCH_RESULT':
      case 'TRACK_LOADED':
        embed
          .setAuthor({ name: 'Трек добавлен!' })
          .setTitle(Utils.escapeFormat(resolvedTracks.tracks[0].info.title))
          .setDescription(Utils.escapeFormat(resolvedTracks.tracks[0].info.author))
          .setURL(resolvedTracks.tracks[0].info.uri ?? null)

        tracks.length = 1
        break
      case 'PLAYLIST_LOADED':
        embed
          .setAuthor({ name: 'Добавлены треки из плейлиста' })
          .setFields([
            { name: 'Добавлено треков', value: tracks.length.toString(), inline: true },
            { name: 'Всего треков', value: resolvedTracks.tracks.length.toString(), inline: true }
          ])
          .setURL(query)
          .setTitle(Utils.escapeFormat(resolvedTracks.playlistInfo.name) ?? 'Без имени')
        break
    }

    return [tracks, embed, []]
  }

  public async resolveSearchResults(query: string, count: number): Promise<BotTrack[]> {
    const node = this.client.shoukaku.getIdealNode()

    if (!node) throw new LoaderError('Нет доступных нод.')

    if (!this.checkQuery(query)) query = `ymsearch:${query}`

    const resolvedTracks = await node?.rest.resolve(query)
    logger.debug({ resolvedTracks })
    if (!resolvedTracks) throw new LoaderError('Не удалось ничего найти по запросу.')
    if (resolvedTracks.tracks.length === 0)
      throw new LoaderError('Не удалось ничего найти по запросу.')

    return this.convertToBotTracks(resolvedTracks.tracks, count, 0)
  }
}
