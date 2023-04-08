import {
  BaseInteraction,
  BaseMessageOptions,
  Collection,
  Guild,
  GuildTextBasedChannel,
  Interaction,
  InteractionReplyOptions,
  Message,
  User,
  VoiceBasedChannel
} from 'discord.js'
import { VkMusicBotClient, CaptchaInfo } from '../client.js'
import { Meta } from '../utils.js'

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

export default interface BaseInteractionManager {
  interactions: Collection<string, BaseCustomInteraction>
  client: VkMusicBotClient
  load(): Promise<void>
  handle(interaction: Interaction): Promise<void>
}
