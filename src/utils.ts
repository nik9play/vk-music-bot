import { EmbedBuilder, InteractionReplyOptions, MessageCreateOptions, TextBasedChannel } from 'discord.js'
import { CaptchaInfo, VkMusicBotClient } from './client.js'
import logger from './logger.js'
import BotPlayer from './modules/botPlayer.js'
import { Constants } from 'shoukaku'
import { RespondFunction } from './interactions/baseInteractionManager.js'
import { getConfig } from './db.js'
import VK from './apis/VK.js'
import { playCommandHandler } from './helpers/playCommandHelper.js'
import { CommandExecuteParams } from './interactions/commandInteractions.js'
import { searchCommandHandler } from './helpers/searchCommandHelper.js'

export interface ArgType {
  type: 'group' | 'playlist' | 'user' | 'track' | 'unknown'
  query?: string
  id?: string
  owner_id?: string
  access_key?: string
}

export interface Meta {
  guild_id?: string
  shard_id?: number
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

  public static playlistRegex =
    /https?:\/\/.*(z=audio_playlist|\/music\/(playlist|album)\/)(-?\d+)[_|/](\d+)([_|/]([a-zA-Z0-9]+))?/

  public static trackRegex = /(^|^https?:\/\/.*\/audio)(-?\d+)_(\d+)(_([a-zA-Z0-9]+))?$/
  public static userGroupRegex = /(>(-\d+))|(>([a-zA-Z0-9]+))/

  public static detectQueryType(query: string): ArgType {
    const playlistMatch = query.match(this.playlistRegex)

    if (playlistMatch) {
      return {
        type: 'playlist',
        owner_id: playlistMatch[3],
        id: playlistMatch[4],
        access_key: playlistMatch[6]
      }
    }

    const trackMatch = query.match(this.trackRegex)

    if (trackMatch) {
      return {
        type: 'track',
        query: `${trackMatch[2]}_${trackMatch[3]}${trackMatch[5] ? '_' + trackMatch[5] : ''}`
      }
    }

    const userOrGroupMatch = query.match(this.userGroupRegex)

    if (userOrGroupMatch) {
      if (userOrGroupMatch[2])
        return {
          type: 'group',
          owner_id: userOrGroupMatch[2]
        }
      if (userOrGroupMatch[4])
        return {
          type: 'user',
          owner_id: userOrGroupMatch[4]
        }
    }

    return {
      type: 'track',
      query
    }
  }

  public static escapeFormat(text: string | undefined): string {
    if (!text) return ''
    //return text.replace(/([*_`~\\])/g, '\\$1')
    return text.replace(/([_*~`|\\<>:!])/g, '\\$1').replace(/@(everyone|here|[!&]?[0-9]{17,21})/g, '@\u200b$1')
  }

  public static escapeQuery(text: string) {
    return text
      .replace(/[-\\/.,;:'"#@!#$%^&*()_=+<>~`|]+/g, '')
      .replace(/\s+/g, ' ')
      .trim()
  }

  public static async handleCaptchaError(
    captchaInfo: CaptchaInfo,
    params: CommandExecuteParams,
    autoSolve = true
  ): Promise<InteractionReplyOptions | null> {
    params.client.captcha.set(params.guild.id, captchaInfo)
    const captcha = captchaInfo

    if (autoSolve && (await getConfig(params.guild.id)).premium) {
      const captchaSolveResponse = await VK.solveCaptcha(captcha.sid)

      if (captchaSolveResponse) {
        logger.info('Captcha solved')
        params.client.captcha.delete(params.guild.id)

        captcha.captcha_key = captchaSolveResponse

        params.captcha = captcha

        if (captcha.type === 'play') {
          await playCommandHandler(params, captcha.query, captcha.count, captcha.offset)
          return null
        }

        if (captcha.type === 'search') {
          await searchCommandHandler(params, captcha.query)
          return null
        }
      }
    }

    return {
      embeds: [
        new EmbedBuilder()
          .setDescription(
            'Ошибка! Требуется капча. Введите команду </captcha:906533763033464832>, а после введите код с картинки. ' +
              `Если картинки не видно, перейдите по [ссылке](${captcha?.url})`
          )
          .setColor(0x5181b8)
          .setImage(captcha.url + this.generateRandomCaptchaString())
      ]
    }
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

    return new EmbedBuilder().setDescription(`${title}\n${message}`).setColor(color)
  }

  public static generateRandomCaptchaString(): string {
    return `&r=${Math.random().toString(36).substring(2, 15)}`
  }

  public static setExitTimeout(player: BotPlayer, client: VkMusicBotClient) {
    this.clearExitTimeout(player.guildId, client)
    logger.debug({ guildId: player.guildId }, `Exit timeout set`)

    client.timers.set(
      player.guildId,
      setTimeout(async () => {
        player?.safeDestroy()
      }, 1_200_000)
    )
  }

  public static clearExitTimeout(guildId: string, client: VkMusicBotClient) {
    logger.debug({ guildId }, `Exit timeout clear`)

    const timer = client.timers.get(guildId)
    if (timer) clearTimeout(timer)
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

  // public static async checkPlayerState(
  //   respond: RespondFunction,
  //   player?: BotPlayer,
  //   voice?: VoiceBasedChannel | null,
  //   checkPlayer = true,
  //   checkVoice = true,
  //   checkQueue = false
  // ): Promise<boolean> {
  //   if (checkPlayer)
  //     if (!player) {
  //       await respond({
  //         embeds: [Utils.generateErrorMessage('Сейчас ничего не играет.')],
  //         ephemeral: true
  //       })
  //       return false
  //     }

  //   if (checkVoice)
  //     if (!voice) {
  //       await respond({
  //         embeds: [Utils.generateErrorMessage('Необходимо находиться в голосовом канале.')],
  //         ephemeral: true
  //       })
  //       return false
  //     }

  //   if (checkQueue)
  //     if (!player?.current) {
  //       await respond({
  //         embeds: [Utils.generateErrorMessage('Очередь пуста.')],
  //         ephemeral: true
  //       })
  //       return false
  //     }

  //   return true
  // }

  public static async sendNoPlayerMessage(respond: RespondFunction) {
    await respond({
      embeds: [Utils.generateErrorMessage('Сейчас ничего не играет.')],
      ephemeral: true
    })
  }

  public static async sendNoVoiceChannelMessage(respond: RespondFunction) {
    await respond({
      embeds: [Utils.generateErrorMessage('Необходимо находиться в голосовом канале.')],
      ephemeral: true
    })
  }

  public static async sendNoQueueMessage(respond: RespondFunction) {
    await respond({
      embeds: [Utils.generateErrorMessage('Очередь пуста.')],
      ephemeral: true
    })
  }

  public static async checkNodeState(player: BotPlayer, respond: RespondFunction) {
    if (player.player.node.state === Constants.State.RECONNECTING) {
      await respond({
        embeds: [
          Utils.generateErrorMessage(
            'Бот в данный момент пытается переподключиться к серверу воспроизведения. ' +
              'В случае удачи бот в течение минуты продолжит воспроизведение.'
          )
        ],
        ephemeral: true
      })
      return
    }
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
