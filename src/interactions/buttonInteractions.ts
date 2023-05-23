import { ButtonInteraction, Collection, Events, Interaction } from 'discord.js'
import BaseInteractionManager, {
  BaseCustomInteraction,
  BaseExecuteParams,
  getRespondFunction,
  getSendFunction
} from './baseInteractionManager.js'
import { VkMusicBotClient } from '../client.js'
import { Meta } from '../utils.js'
import { glob } from 'glob'
import logger from '../logger.js'

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

    this.client.on(Events.InteractionCreate, (interaction) =>
      this.handle(interaction).catch((err) => logger.error({ err }, 'Error handle button'))
    )
  }

  async load() {
    const files = await glob(`**/dist/interactions/buttons/*.js`)

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
      guildId: guild?.id,
      shardId: guild?.shardId
    }

    const customId = interaction.customId.split(',')
    const name = customId[0]
    const customAction = customId[1]
    logger.debug(interaction.customId, 'Button interaction id')

    const respond = getRespondFunction(interaction, meta)

    const send = getSendFunction(text, meta)

    const buttonInteraction = this.interactions.get(name)
    await buttonInteraction
      ?.execute({
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
      .catch((err) => logger.error({ err, ...meta }, 'Error executing button'))

    return
  }
}
