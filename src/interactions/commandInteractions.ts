import {
  BaseMessageOptions,
  ChatInputCommandInteraction,
  Collection,
  Events,
  Interaction,
  InteractionReplyOptions,
  PermissionsBitField,
  User
} from 'discord.js'
import BaseInteractionManager, { BaseCustomInteraction, BaseExecuteParams } from './baseInteractionManager.js'
import logger from '../logger.js'
import Utils, { Meta } from '../utils.js'
import { VkMusicBotClient } from '../client.js'
import { getConfig } from '../db.js'
import glob from 'glob'
import { promisify } from 'util'

const globPromise = promisify(glob)

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

    this.client.on(Events.InteractionCreate, (interaction) => this.handle(interaction))
  }

  async load() {
    const files = await globPromise(`**/dist/interactions/commands/*.js`)

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
      .catch((err) => logger.error({ err, ...meta }, 'Error executing command'))
  }
}
