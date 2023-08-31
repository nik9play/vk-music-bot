import { Collection, Events, Interaction, ModalSubmitInteraction } from 'discord.js'
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

export interface ModalCustomInteraction extends BaseCustomInteraction {
  execute(params: ModalExecuteParams): Promise<void>
}

export interface ModalExecuteParams extends BaseExecuteParams {
  interaction: ModalSubmitInteraction<'cached'>
}

export class ModalInteractionManager implements BaseInteractionManager {
  public interactions: Collection<string, ModalCustomInteraction> = new Collection()
  public client: VkMusicBotClient

  constructor(client: VkMusicBotClient) {
    this.client = client

    this.client.on(Events.InteractionCreate, (interaction) =>
      this.handle(interaction).catch((err) => logger.error({ err }, 'Error handle modal'))
    )
  }

  async load() {
    // const files = await glob(`**/dist/interactions/modals/*.js`)
    // for (const file of files) {
    //   const module = await import(`../../${file}`)
    //   const interaction: ModalCustomInteraction = module.interaction
    //   this.interactions.set(interaction.name, interaction)
    // }
  }

  async handle(interaction: Interaction) {
    if (!interaction.inCachedGuild()) return
    if (!interaction.isModalSubmit()) return

    const guild = interaction.guild
    const user = interaction.member?.user
    const member = interaction.member
    const text = interaction.channel
    const voice = member?.voice?.channel

    const meta: Meta = {
      guild_id: guild?.id,
      shard_id: guild?.shardId
    }

    if (!text) return

    const respond = getRespondFunction(interaction, meta)

    const send = getSendFunction(text, meta)

    if (interaction?.customId === 'trackRequestModal') {
      logger.info({ ...meta }, 'Search result selected')

      if (!interaction.deferred) await interaction.deferReply()

      const requestText = interaction.fields.getTextInputValue('trackRequest')
      const countText = interaction.fields.getTextInputValue('count')
      const offsetText = interaction.fields.getTextInputValue('offset')

      logger.debug({ requestText, countText, offsetText })

      const countNumber = parseInt(countText)
      const offsetNumber = parseInt(offsetText)

      const count = isNaN(countNumber) ? 50 : countNumber
      const offset = isNaN(offsetNumber) ? 1 : offsetNumber

      const partialParams: Partial<CommandExecuteParams> = {
        guild,
        user,
        voice,
        text,
        client: this.client,
        respond,
        send,
        meta
      }

      this.client.userActionsManager.addAction(guild.id, {
        type: 'modal',
        memberId: interaction.member.id,
        name: `Добавление трека`
      })

      await playCommandHandler(
        partialParams as CommandExecuteParams,
        requestText,
        count,
        offset
      ).catch((err: any) => logger.error({ err, ...meta }, 'Error executing modal command'))
    }
  }
}
