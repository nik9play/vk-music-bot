import { MessageEmbed, TextChannel } from 'discord.js'
import { Player } from 'erela.js-vk/structures/Player'
import { VkMusicBotClient } from './client'
import logger from './Logger'

export interface ArgType {
  type: 'group' | 'playlist' | 'user' | 'track' | 'unknown',
  id?: string,
  parsedURL?: PlaylistURL
}

export interface PlaylistURL {
  id: string | null,
  access_key: string | null
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
    return titles[(number % 100 > 4 && number % 100 < 20) ? 2 : cases[(number % 10 < 5) ? number % 10 : 5]]
  }

  public static parsePlaylistURL(url: URL): PlaylistURL {
    if (url.pathname.includes('/music/playlist/') || url.pathname.includes('/music/album/')) {
      const query = url.pathname.split('/')[3]
      let id = null, access_key = null

      if (query) {
        const queryArr = query.split('_')

        id = `${queryArr[0]}_${queryArr[1]}`
        access_key = queryArr[2]
      }

      return {
        id,
        access_key
      }
    } else {
      const query = url.searchParams.get('z')
      let id = null, access_key = null

      if (query) {
        id = query.split('/')[0].replace('audio_playlist', '')
        access_key = query.split('/')[1]
      }

      return {
        id,
        access_key
      }
    }
  }

  public static detectArgType(arg: string): ArgType {
    if (arg.startsWith('>-')) {
      return {
        type: 'group',
        id: arg.slice(1)
      }
    } else if (arg.startsWith('>')) {
      return {
        type: 'user',
        id: arg.slice(1)
      }
    } else {
      try {
        const url = new URL(arg)

        if (!url.searchParams.has('z')) {
          if (url.pathname.startsWith('/audios-') && !url.searchParams.has('z'))
            return {
              type: 'group',
              id: url.pathname.slice(7)
            }

          if (url.pathname.startsWith('/audios') && !url.searchParams.has('z'))
            return {
              type: 'user',
              id: url.pathname.slice(7)
            }
        }

        // if (url.searchParams.has("w")) {
        //   return {
        //     type: "wall",
        //     id: url.get("w").slice(4)
        //   }
        // }

        const parsedURL = this.parsePlaylistURL(url)

        if (!parsedURL.id) {
          return {
            type: 'unknown'
          }
        }

        return {
          type: 'playlist',
          parsedURL
        }
      } catch {
        return {
          type: 'track'
        }
      }
    }
  }

  public static escapeFormat(text: string | undefined): string {
    if (!text) return ''
    return text.replace(/([*_`~\\])/g, '\\$1')
  }

  public static generateErrorMessage(message: string, type: ErrorMessageType = ErrorMessageType.Error, escapeFormatting = false): MessageEmbed {
    let title
    let color

    switch (type) {
    case ErrorMessageType.Error:
      title = '<:no2:835498572916195368> **Ошибка!**\n'
      color = 0xED4245
      break
    case ErrorMessageType.Warning:
      title = '⚠️ **Предупреждение**\n'
      color = 0xFEE75C
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

    return new MessageEmbed({
      description: `${title}\n${message}`,
      color
    })
  }

  public static generateRandomCaptchaString(): string {
    return `&r=${Math.random().toString(36).substring(2, 15)}`
  }

  public static getExitTimeout(player: Player, client: VkMusicBotClient): NodeJS.Timeout {
    return setTimeout(async () => {
      if (player) {
        logger.info(`Exit timeout set ${player.guild}`)

        player.destroy()

        if (player.textChannel == null) return

        const channel = client.channels.cache.get(player.textChannel)

        if (channel instanceof TextChannel) {
          try {
            const message = await channel.send({
              embeds: [{
                description: `**Я покинул канал, так как слишком долго был неактивен.**\n Хотите, чтобы я оставался? Включите режим 24/7 (доступен только для Премиум пользователей, подробности: \`${await client.db.getPrefix(player.guild)}donate\`). `,
                color: 0x5181b8
              }]
            })

            setTimeout(() => {
              if (message && typeof message.delete === 'function') {
                message.delete().catch(err => logger.error({ err }, 'Can\'t delete message'))
              }
            }, 30000)
          } catch (err) {
            logger.warn({ err }, 'Can\'t send timeout message')
          }

        }
      }
    }, 1200000)
  }

}