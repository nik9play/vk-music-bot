import { ChatInputCommandInteraction, Collection, Events, Interaction, PermissionsBitField } from 'discord.js'
import BaseInteractionManager, {
  BaseCustomInteraction,
  BaseExecuteParams,
  getRespondFunction,
  getSendFunction
} from './baseInteractionManager.js'
import logger from '../logger.js'
import Utils, { Meta } from '../utils.js'
import { VkMusicBotClient } from '../client.js'
import { getConfig } from '../db.js'
import { glob } from 'glob'
// const globPromise = promisify(glob)

export interface CommandExecuteParams extends BaseExecuteParams {
  interaction: ChatInputCommandInteraction<'cached'>
}

export interface CommandCustomInteraction extends BaseCustomInteraction {
  name: string
  aliases?: string[]
  adminOnly: boolean
  premium: boolean
  cooldown?: number
  djOnly: boolean
  deferred?: boolean
  execute(params: CommandExecuteParams): Promise<void>
}

export class CommandInteractionManager implements BaseInteractionManager {
  public interactions: Collection<string, CommandCustomInteraction> = new Collection()
  public client: VkMusicBotClient

  constructor(client: VkMusicBotClient) {
    this.client = client

    this.client.on(Events.InteractionCreate, (interaction) =>
      this.handle(interaction).catch((err) => logger.error({ err }, 'Error handle command'))
    )
  }

  async load() {
    const files = await glob(`**/dist/interactions/commands/*.js`)

    for (const file of files) {
      const module = await import(`../../${file}`)
      const interaction: CommandCustomInteraction = module.interaction

      this.interactions.set(interaction.name, interaction)
    }
  }

  async handle(interaction: Interaction) {
    if (!interaction.inCachedGuild()) return
    if (!interaction.isChatInputCommand()) return

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

    const respond = getRespondFunction(interaction, meta)

    const send = getSendFunction(text, meta)

    const command = this.interactions.get(interaction.commandName)

    if (!command) {
      await respond({
        content: 'Неизвестная команда'
      })
      return
    }

    // редактировать ответ если команда отложена
    if (command.deferred && !interaction.deferred) await interaction.deferReply()

    // проверка на админа
    if (command.adminOnly && !member.permissions.has(PermissionsBitField.Flags.ManageGuild)) {
      await respond({
        embeds: [
          Utils.generateErrorMessage('Эту команду могут выполнять только пользователи с правом `Управление сервером`.')
        ],
        ephemeral: true
      })
      return
    }

    // проверка на dj роль
    const config = await getConfig(guild.id)

    if (config.djMode) {
      const djRole = config.djRoleName

      if (
        !member.permissions.has(PermissionsBitField.Flags.ManageGuild) &&
        !member.roles.cache.some((role) => role.name === djRole)
      ) {
        await respond({
          embeds: [
            Utils.generateErrorMessage(
              `Сейчас включен DJ режим, и вы не можете выполнять команды, так как у вас нет роли \`${djRole}\`.`
            )
          ],
          ephemeral: true
        })
        return
      }
    }

    // проверка на премиум
    if (command.premium && !config.premium) {
      await respond({
        embeds: [
          Utils.generateErrorMessage(
            'Для выполнения этой команды требуется **Премиум**! Подробности: </donate:906533685979918396>.'
          )
        ],
        ephemeral: true
      })
      return
    }

    // const args: string[] =
    //   interaction.options.data.map((el): string => {
    //     if (el.type === 'CHANNEL' && el.channel) {
    //       if (el.channel.type === 'GUILD_TEXT') {
    //         return `<#${el.channel.id}>`
    //       }
    //     }
    //
    //     if (el.value) return el.value.toString()
    //     return ''
    //   }) ?? []

    logger.info({ ...meta }, `Executed command ${command.name}`)

    if (command.name === 'play' || command.name === 'search') {
      const captcha = this.client.captcha.get(guild.id)

      if (captcha) {
        const embed = {
          description:
            'Ошибка! Требуется капча. Введите команду </captcha:906533763033464832>, а после введите код с картинки. ' +
            `Если картинки не видно, перейдите по [ссылке](${captcha?.url})` +
            '\nЕсли больше не хотите видеть капчу, приобретите **Премиум**. Подробности: </donate:906533685979918396>',
          color: 0x5181b8,
          image: {
            url: captcha.url + Utils.generateRandomCaptchaString()
          }
        }

        await respond({ embeds: [embed], ephemeral: true })
        return
      }
    }

    await command
      .execute({
        guild,
        user,
        voice,
        text,
        client: this.client,
        interaction,
        respond,
        send,
        meta
      })
      .catch(async (err) => {
        logger.error({ err, ...meta }, 'Error executing command')

        await respond({
          embeds: [
            Utils.generateErrorMessage(
              'Произошла непредвиденная ошибка. Обратитесь за поддержкой в' +
                ' [группу ВК](https://vk.com/vkmusicbotds) или на [сервер Discord](https://discord.com/invite/3ts2znePu7).'
            )
          ]
        }).catch((err) => logger.error({ err }, 'Error while sending error message'))
      })
  }
}
