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
  public captcha_sid: string
  public captcha_url: string

  constructor(captcha_sid: string, captcha_url: string) {
    super('Требуется капча.')
    this.captcha_sid = captcha_sid
    this.captcha_url = captcha_url
  }
}

export default abstract class BaseLoader {
  public abstract get name(): string
  public abstract get color(): number
  public client: VkMusicBotClient

  constructor(client: VkMusicBotClient) {
    this.client = client
  }

  public abstract resolveTracks(
    query: string,
    count?: number,
    offset?: number,
    captcha?: CaptchaInfo
  ): Promise<[BotTrack[], EmbedBuilder, string[]]>
}
