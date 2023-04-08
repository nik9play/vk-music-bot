import {
  BaseMessageOptions,
  ButtonInteraction,
  Collection,
  Events,
  Interaction,
  InteractionReplyOptions,
  PermissionsBitField,
  User
} from 'discord.js'
import BaseInteractionManager, { BaseCustomInteraction, BaseExecuteParams } from './baseInteractionManager.js'
import { VkMusicBotClient } from '../client.js'
import { Meta } from '../utils.js'
import logger from '../logger.js'
import glob from 'glob'
import { promisify } from 'util'

const globPromise = promisify(glob)

export interface ButtonCustomInteraction extends BaseCustomInteraction {
  name: string
  execute(params: ButtonExecuteParams): Promise<void>
}

export interface ButtonExecuteParams extends BaseExecuteParams {
  interaction: ButtonInteraction<'cached'>
  customAction?: string
}

export class ButtonInteractionManager implements BaseInteractionManager {
  public interactions: Collection<string, ButtonCustomInteraction> = new Collection()
  public client: VkMusicBotClient

  constructor(client: VkMusicBotClient) {
    this.client = client

    this.client.on(Events.InteractionCreate, (interaction) => this.handle(interaction))
  }

  async load() {
    const files = await globPromise(`**/dist/interactions/buttons/*.js`)

    for (const file of files) {
      const module = await import(`../../${file}`)
      const interaction: ButtonCustomInteraction = module.interaction

      this.interactions.set(interaction.name, interaction)
    }
  }

  async handle(interaction: Interaction) {
    if (!interaction.inCachedGuild()) return
    if (!interaction.isButton()) return

    const guild = interaction.guild
    const user = interaction.member?.user
    const member = interaction.member
    const text = interaction.channel
    const voice = member?.voice?.channel

    if (!text) return

    const meta: Meta = {
      guild_id: guild?.id,
      shard_id: guild?.shardId
    }

    const customId = interaction.customId.split(',')
    const name = customId[0]
    const customAction = customId[1]
    console.log(interaction.customId)

    const respond = async (data: InteractionReplyOptions, timeout?: number): Promise<void> => {
      if (interaction.deferred) {
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

    const send = async (data: BaseMessageOptions, timeout?: number): Promise<void> => {
      if (!text?.permissionsFor(this.client.user as User)?.has(PermissionsBitField.Flags.SendMessages)) return

      await text
        .send(data)
        .catch((err) => {
          logger.error({ err, ...meta }, "Can't send message")
          return
        })
        .then((message) => {
          if (timeout && message) {
            setTimeout(async () => {
              if (!message.channel.isTextBased()) return

              if (message.deletable)
                await message.delete().catch((err) => {
                  logger.error({ err, ...meta }, "Can't delete message")
                })
            }, timeout)
          }
        })
    }

    const buttonInteraction = this.interactions.get(name)
    await buttonInteraction?.execute({
      guild,
      text,
      voice,
      client: this.client,
      user,
      respond,
      send,
      meta,
      interaction,
      customAction
    })

    return
  }
}
