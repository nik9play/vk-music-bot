import {
  BaseInteraction,
  BaseMessageOptions,
  ButtonInteraction,
  ChatInputCommandInteraction,
  Guild,
  GuildTextBasedChannel,
  InteractionReplyOptions,
  Message,
  PermissionsBitField,
  StringSelectMenuInteraction,
  User,
  VoiceBasedChannel
} from 'discord.js'
import logger from '../logger.js'
import { CaptchaInfo, VkMusicBotClient } from '../client.js'
import { playCommandHandler } from '../helpers/playCommandHelper.js'
import Utils from '../utils.js'
import glob from 'glob'
import { promisify } from 'util'
import { getConfig } from '../db.js'
import BotPlayer from './botPlayer.js'

const globPromise = promisify(glob)

export interface Meta {
  guild_id?: string
  shard_id?: number
}

export type RespondFunction = (data: InteractionReplyOptions, timeout?: number) => Promise<void>
export type SendFunction = (data: BaseMessageOptions, timeout?: number) => Promise<void>

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

export type ButtonCustomInteraction = {
  name: string
  execute(params: ButtonExecuteParams): Promise<void>
}

export interface ButtonExecuteParams extends BaseExecuteParams {
  interaction: ButtonInteraction<'cached'>
  customAction?: string
}

export type CommandType = {
  name: string
  aliases?: string[]
  adminOnly: boolean
  premium: boolean
  cooldown?: number
  djOnly: boolean
  deferred?: boolean
  execute(params: CommandExecuteParams): Promise<void>
}

export class Command {
  constructor(commandType: CommandType) {
    Object.assign(this, commandType)
  }
}

export interface CommandExecuteParams extends BaseExecuteParams {
  interaction: ChatInputCommandInteraction<'cached'>
}

export default class SlashCommandManager {
  private readonly client: VkMusicBotClient

  constructor(client: VkMusicBotClient) {
    this.client = client
  }

  public async init() {
    const commandFiles = await globPromise('**/dist/slashCommands/*.js')

    for (const file of commandFiles) {
      const module = await import(`../../${file}`)
      const command: CommandType = module.default

      this.client.commands.set(command.name, command)
      // if (command.aliases) {
      //   command.aliases.forEach((alias: string) => {
      //     this.client.commands.set(alias, command)
      //   })
      // }
    }

    const buttonInteractionFiles = await globPromise('**/dist/interactions/buttons/*.js')

    for (const file of buttonInteractionFiles) {
      const module = await import(`../../${file}`)
      const buttonInteraction: ButtonCustomInteraction = module.default

      this.client.buttonInteractions.set(buttonInteraction.name, buttonInteraction)
    }

    this.client.on('interactionCreate', async (interaction) => {
      //console.log(interaction.options.data)
      if (!interaction.inCachedGuild()) return

      if (interaction.isChatInputCommand() || interaction.isButton() || interaction.isStringSelectMenu())
        this.executeSlash(interaction).catch((err) =>
          logger.error(
            {
              err
            },
            'executeSlash'
          )
        )

      // if (interaction.isAutocomplete()) {
      //   this.executeAutocomplete(interaction).catch((err) => {
      //     logger.error(
      //       {
      //         shard_id: this.client.cluster.id,
      //         err
      //       },
      //       'executeAutocomplete'
      //     )
      //   })
      // }
    })
  }

  /*
   * Слэш команды
   */
  async executeSlash(
    interaction:
      | ChatInputCommandInteraction<'cached'>
      | ButtonInteraction<'cached'>
      | StringSelectMenuInteraction<'cached'>
  ) {
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

    const respond = async (data: InteractionReplyOptions, timeout?: number): Promise<void> => {
      if (interaction.deferred) {
        await interaction.editReply(data).catch((err) => logger.error({ err, ...meta }, "Can't edit reply"))
        return
      }

      if (interaction.isRepliable()) {
        try {
          await interaction.reply(data)
        } catch (err) {
          logger.error({ err, ...meta }, "Can't send reply")
        }

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

    if (interaction.isChatInputCommand()) {
      const command = this.client.commands.get(interaction.commandName)

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
            Utils.generateErrorMessage(
              'Эту команду могут выполнять только пользователи с правом `Управление сервером`.'
            )
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
            Utils.generateErrorMessage('Для выполнения этой команды требуется **Премиум**! Подробности: /donate.')
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
              'Ошибка! Ожидается команда, для которой не введена капча. Введите команду `/captcha`, а после код с картинки. ' +
              `Если картинки не видно, перейдите по [ссылке](${captcha.url}) (только один раз).`,
            color: 0x5181b8,
            image: {
              url: captcha.url + Utils.generateRandomCaptchaString()
            }
          }

          await respond({ embeds: [embed], ephemeral: true })
          return
        }
      }

      command
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
        .catch((err) => logger.error({ err, ...meta }, 'Error executing command'))
    }

    if (interaction.isButton()) {
      const customId = interaction.customId.split(',')
      const name = customId[0]
      const customAction = customId[1]
      console.log(interaction.customId)

      const buttonInteraction = this.client.buttonInteractions.get(name)
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

    if (interaction.isStringSelectMenu()) {
      if (interaction?.customId === 'search') {
        const id = interaction.values[0].split(',')[1]
        logger.info({ ...meta }, 'Search result selected')

        if (id) {
          if (!interaction.deferred) await interaction.deferReply()

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

          playCommandHandler(partialParams as CommandExecuteParams, id).catch((err: any) =>
            logger.error({ err, ...meta }, 'Error executing command from button')
          )
        }
      }
    }
  }

  // async executeAutocomplete(interaction: AutocompleteInteraction) {
  //   if (interaction.commandName === 'play') {
  //   }
  // }
}
