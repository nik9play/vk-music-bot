import {
  BaseInteraction,
  BaseMessageOptions,
  Collection,
  Guild,
  GuildTextBasedChannel,
  Interaction,
  InteractionReplyOptions,
  Message,
  PermissionsBitField,
  User,
  VoiceBasedChannel
} from 'discord.js'
import { VkMusicBotClient, CaptchaInfo } from '../client.js'
import { Meta } from '../utils.js'
import logger from '../logger.js'

export interface BaseExecuteParams {
  guild: Guild
  user: User
  voice?: VoiceBasedChannel | null
  text: GuildTextBasedChannel
  client: VkMusicBotClient
  interaction: BaseInteraction<'cached'>
  respond: RespondFunction
  send: SendFunction
  message?: Message
  captcha?: CaptchaInfo
  meta: Meta
}

export type RespondFunction = (data: InteractionReplyOptions, timeout?: number) => Promise<void>
export type SendFunction = (data: BaseMessageOptions, timeout?: number) => Promise<void>

export interface BaseCustomInteraction {
  name: string
  execute(params: BaseExecuteParams): Promise<void>
}

export function getRespondFunction(interaction: Interaction, meta: Meta) {
  return async (data: InteractionReplyOptions, timeout?: number): Promise<void> => {
    if (!interaction.isAutocomplete() && interaction.deferred) {
      await interaction.editReply(data).catch((err) => logger.error({ err, ...meta }, "Can't edit reply"))
      return
    }

    if (interaction.isRepliable()) {
      await interaction.reply(data).catch((err) => {
        logger.error({ err, ...meta }, "Can't send reply")
        return
      })

      if (timeout)
        setTimeout(async () => {
          await interaction.deleteReply().catch((err) => {
            logger.error({ err, ...meta }, 'Error deleting reply')
          })
        }, timeout)
    }
  }
}

export function getSendFunction(text: GuildTextBasedChannel, client: VkMusicBotClient, meta: Meta) {
  return async (data: BaseMessageOptions, timeout?: number): Promise<void> => {
    if (!text.permissionsFor(client.user as User)?.has(PermissionsBitField.Flags.SendMessages)) return

    try {
      const message = await text.send(data)

      if (timeout) {
        setTimeout(async () => {
          if (!message.channel.isTextBased()) return

          if (message.deletable)
            await message.delete().catch((err) => {
              logger.error({ err, ...meta }, "Can't delete message")
            })
        }, timeout)
      }
    } catch (err) {
      logger.error({ err, ...meta }, "Can't send message")
    }
  }
}

export default interface BaseInteractionManager {
  interactions: Collection<string, BaseCustomInteraction>
  client: VkMusicBotClient
  load(): Promise<void>
  handle(interaction: Interaction): Promise<void>
}
