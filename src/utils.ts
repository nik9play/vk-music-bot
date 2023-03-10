import { EmbedBuilder, MessageCreateOptions, TextBasedChannel, VoiceBasedChannel } from 'discord.js'
import { VkMusicBotClient } from './client.js'
import CustomPlayer from './kazagumo/CustomPlayer.js'
import logger from './logger.js'
import { RespondFunction } from './slashCommandManager.js'

export interface ArgType {
  type: 'group' | 'playlist' | 'user' | 'track' | 'unknown'
  query?: string
  id?: string
  owner_id?: string
  access_key?: string
}

export interface PlaylistURL {
  id?: string
  owner_id?: string
  access_key?: string
}

export enum ErrorMessageType {
  Error,
  Warning,
  Info,
  NoTitle
}

export default class Utils {
  public static declOfNum(number: number, titles: string[]): string {
    const cases = [2, 0, 1, 1, 1, 2]
    return titles[number % 100 > 4 && number % 100 < 20 ? 2 : cases[number % 10 < 5 ? number % 10 : 5]]
  }

  private static urlRegex1 = /\/music\/(playlist|album)\/([0-9]+)_([0-9]+)(_([A-Za-z0-9]*))?/
  private static urlRegex2 = /audio_playlist([0-9]+)(_|\/)([0-9]+)((_|\/)([A-Za-z0-9]*))?/

  public static parsePlaylistURL(url: URL): PlaylistURL | null {
    const match1 = url.toString().match(this.urlRegex1)

    if (match1)
      return {
        id: match1[3],
        owner_id: match1[2],
        access_key: match1[5]
      }

    const match2 = url.toString().match(this.urlRegex2)

    if (match2)
      return {
        id: match2[3],
        owner_id: match2[1],
        access_key: url.searchParams.get('access_key') ?? match2[6]
      }

    return null
  }

  private static trackRegex = /\/audio([0-9]+)_([0-9]+)(_([A-Za-z0-9]*))?/

  public static detectArgType(arg: string): ArgType {
    if (arg.startsWith('>-')) {
      return {
        type: 'group',
        owner_id: arg.slice(1)
      }
    } else if (arg.startsWith('>')) {
      return {
        type: 'user',
        owner_id: arg.slice(1)
      }
    } else {
      try {
        const url = new URL(arg)

        const match = arg.match(this.trackRegex)
        if (match) {
          return {
            type: 'track',
            query: `${match[1]}_${match[2]}${match[4] ? '_' + match[4] : ''}`
          }
        }

        if (!url.searchParams.has('z')) {
          if (url.pathname.startsWith('/audios-') && !url.searchParams.has('z'))
            return {
              type: 'group',
              owner_id: url.pathname.slice(7)
            }

          if (url.pathname.startsWith('/audios') && !url.searchParams.has('z'))
            return {
              type: 'user',
              owner_id: url.pathname.slice(7)
            }
        }

        const parsedURL = this.parsePlaylistURL(url)

        if (!parsedURL || !parsedURL.id || !parsedURL.owner_id) {
          return {
            type: 'unknown'
          }
        }

        return {
          type: 'playlist',
          id: parsedURL.id,
          owner_id: parsedURL.owner_id,
          access_key: parsedURL.access_key
        }
      } catch {
        return {
          type: 'track',
          query: arg
        }
      }
    }
  }

  public static escapeFormat(text: string | undefined): string {
    if (!text) return ''
    //return text.replace(/([*_`~\\])/g, '\\$1')
    return text.replace(/([_*~`|\\<>:!])/g, '\\$1').replace(/@(everyone|here|[!&]?[0-9]{17,21})/g, '@\u200b$1')
  }

  public static generateErrorMessage(
    message: string,
    type: ErrorMessageType = ErrorMessageType.Error,
    escapeFormatting = false
  ): EmbedBuilder {
    let title
    let color

    switch (type) {
      case ErrorMessageType.Error:
        title = '<:no2:835498572916195368> **Ошибка!**\n'
        color = 0xed4245
        break
      case ErrorMessageType.Warning:
        title = '⚠️ **Предупреждение**\n'
        color = 0xfee75c
        break
      case ErrorMessageType.Info:
        title = 'ℹ️ **Информация**\n'
        color = 0x3b88c3
        break
      case ErrorMessageType.NoTitle:
        title = ''
        color = 0x5181b8
    }

    if (escapeFormatting) {
      message = this.escapeFormat(message)
    }

    return new EmbedBuilder({
      description: `${title}\n${message}`,
      color
    })
  }

  public static generateRandomCaptchaString(): string {
    return `&r=${Math.random().toString(36).substring(2, 15)}`
  }

  public static getExitTimeout(player: CustomPlayer, client: VkMusicBotClient): NodeJS.Timeout {
    logger.info(`Exit timeout set ${player.guildId}`)

    return setTimeout(async () => {
      if (player) {
        player.destroy()
        //console.log(client)

        // if (player.textChannel == null) return

        // const channel = client.channels.cache.get(player.textChannel)

        // if (channel?.isText()) {
        //   try {
        //     const message = await channel.send({
        //       embeds: [{
        //         description: '**Я покинул канал, так как слишком долго был неактивен.**\n Хотите, чтобы я оставался? Включите режим 24/7 (доступен только для Премиум пользователей, подробности: `/donate`). ',
        //         color: 0x5181b8
        //       }]
        //     })

        //     setTimeout(() => {
        //       if (message && typeof message.delete === 'function') {
        //         message.delete().catch(err => logger.error({ err }, 'Can\'t delete message'))
        //       }
        //     }, 30000)
        //   } catch (err) {
        //     logger.error({ err }, 'Can\'t send timeout message')
        //   }

        // }
      }
    }, 1200000)
  }

  public static async sendMessageToChannel(channel: TextBasedChannel, content: MessageCreateOptions, timeout?: number) {
    try {
      const message = await channel.send(content)

      if (timeout)
        setTimeout(async () => {
          if (message.deletable) await message.delete().catch((err) => logger.error({ err }, "Can't delete message"))
        }, timeout)
      else if (message.deletable) await message.delete().catch((err) => logger.error({ err }, "Can't delete message"))
    } catch {
      logger.error("Can't send message")
    }
  }

  public static async checkPlayerState(
    respond: RespondFunction,
    player?: CustomPlayer,
    voice?: VoiceBasedChannel | null,
    checkPlayer = true,
    checkVoice = true,
    checkQueue = false
  ): Promise<boolean> {
    if (checkPlayer)
      if (!player) {
        await respond({
          embeds: [Utils.generateErrorMessage('Сейчас ничего не играет.')],
          ephemeral: true
        })
        return false
      }

    if (checkVoice)
      if (!voice) {
        await respond({
          embeds: [Utils.generateErrorMessage('Необходимо находиться в голосовом канале.')],
          ephemeral: true
        })
        return false
      }

    if (checkQueue)
      if (!player?.queue.current) {
        await respond({
          embeds: [Utils.generateErrorMessage('Очередь пуста.')],
          ephemeral: true
        })
        return false
      }

    return true
  }

  public static generateTrackUrl(source_id: string, access_key?: string): string {
    return `https://vk.com/audio${source_id}${access_key ? '_' + access_key : ''}`
  }

  public static formatTime(milliseconds: number): string {
    const seconds = milliseconds / 1000

    const minutes = Math.floor(seconds / 60)
    const remainingSeconds = Math.round(seconds % 60)

    return `${minutes.toString().padStart(2, '0')}:${remainingSeconds.toString().padStart(2, '0')}`
  }
}
