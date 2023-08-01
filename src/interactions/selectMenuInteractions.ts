import { Collection, Events, Interaction, StringSelectMenuInteraction } from 'discord.js'
import BaseInteractionManager, {
  BaseCustomInteraction,
  BaseExecuteParams,
  getRespondFunction,
  getSendFunction
} from './baseInteractionManager.js'
import { VkMusicBotClient } from '../client.js'
import logger from '../logger.js'
import { Meta } from '../utils.js'
import { CommandExecuteParams } from './commandInteractions.js'
import { playCommandHandler } from '../helpers/playCommandHelper.js'

export interface SelectMenuCustomInteraction extends BaseCustomInteraction {
  name: string
  execute(params: BaseExecuteParams): Promise<void>
}

export interface SelectMenuExecuteParams extends BaseExecuteParams {
  interaction: StringSelectMenuInteraction<'cached'>
}

export class SelectMenuInteractionManager implements BaseInteractionManager {
  public interactions: Collection<string, SelectMenuCustomInteraction> = new Collection()
  public client: VkMusicBotClient

  constructor(client: VkMusicBotClient) {
    this.client = client

    this.client.on(Events.InteractionCreate, (interaction) =>
      this.handle(interaction).catch((err) => logger.error({ err }, 'Error handle select menu'))
    )
  }

  async load() {
    //
  }

  async handle(interaction: Interaction) {
    if (!interaction.inCachedGuild()) return
    if (!interaction.isStringSelectMenu()) return

    const guild = interaction.guild
    const user = interaction.member?.user
    const member = interaction.member
    const text = interaction.channel
    const voice = member?.voice?.channel

    const meta: Meta = {
      guildId: guild?.id,
      shardId: guild?.shardId
    }

    if (!text) return

    const respond = getRespondFunction(interaction, meta)

    const send = getSendFunction(text, meta)

    if (interaction?.customId === 'search') {
      const id = interaction.values[0].split(',')[1]
      logger.debug({ id }, 'select menu search')
      const meta: Meta = {
        guildId: guild?.id,
        shardId: guild?.shardId
      }

      logger.info({ ...meta }, 'Search result selected')

      if (id) {
        if (!interaction.deferred) await interaction.deferReply()

        const partialParams: Omit<CommandExecuteParams, 'interaction'> = {
          guild,
          user,
          voice,
          text,
          client: this.client,
          respond,
          send,
          meta
        }

        playCommandHandler(partialParams, id).catch((err: any) =>
          logger.error({ err, ...meta }, 'Error executing select menu command')
        )
      }
    }
  }
}
