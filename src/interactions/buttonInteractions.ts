import { ButtonInteraction, Collection, Events, Interaction } from 'discord.js'
import BaseInteractionManager, {
  BaseCustomInteraction,
  BaseExecuteParams,
  getRespondFunction,
  getSendFunction
} from './baseInteractionManager.js'
import { VkMusicBotClient } from '../client.js'
import { Meta } from '../utils.js'
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

    const respond = getRespondFunction(interaction, meta)

    const send = getSendFunction(text, this.client, meta)

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
