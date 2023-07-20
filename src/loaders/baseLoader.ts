import { VkMusicBotClient } from 'client.js'
import { EmbedBuilder } from 'discord.js'
import BotTrack from 'structures/botTrack.js'

export interface CaptchaInfo {
  type: 'play' | 'search'
  query: string
  count?: number | null
  offset?: number | null
  url: string
  sid: string
  index: number
  key?: string
}

export class LoaderError extends Error {}

export class CaptchaLoaderError extends LoaderError {
  public captcha_sid: number
  public captcha_url: string
  public captcha_index: number

  constructor(captcha_sid: number, captcha_url: string, captcha_index: number) {
    super('Требуется капча.')
    this.captcha_sid = captcha_sid
    this.captcha_url = captcha_url
    this.captcha_index = captcha_index
  }
}

export default abstract class BaseLoader {
  public abstract get name(): string
  public abstract get color(): number
  public client: VkMusicBotClient

  constructor(client: VkMusicBotClient) {
    this.client = client
  }

  public abstract checkQuery(query: string): boolean

  public abstract resolveTracks(
    query: string,
    count?: number | null,
    offset?: number | null,
    captcha?: CaptchaInfo
  ): Promise<[BotTrack[], EmbedBuilder, string[]]>
}
