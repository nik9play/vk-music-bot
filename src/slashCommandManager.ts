import {
  BaseMessageOptions,
  ButtonInteraction,
  ChatInputCommandInteraction,
  CommandInteraction,
  Guild,
  GuildMember,
  GuildTextBasedChannel,
  InteractionReplyOptions,
  InteractionUpdateOptions,
  Message,
  PermissionsBitField,
  StringSelectMenuInteraction,
  TextBasedChannel,
  User,
  VoiceBasedChannel
} from 'discord.js'
import logger from './logger.js'
import { CaptchaInfo, VkMusicBotClient } from './client.js'
import { playCommand } from './helpers/playCommandHelper.js'
import Utils from './utils.js'
import glob from 'glob'
import { promisify } from 'util'
import { generateQueueResponse } from './helpers/queueCommandHelper.js'
import CustomPlayer from './kagazumo/CustomPlayer.js'
import { generateMenuResponse, MenuButtonType } from './helpers/menuCommandHelper.js'

const globPromise = promisify(glob)

export interface Meta {
  guild_id?: string
  shard_id: number
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

export type RespondFunction = (data: InteractionReplyOptions, timeout?: number) => Promise<void>
export type SendFunction = (data: BaseMessageOptions, timeout?: number) => Promise<void>

export interface CommandExecuteParams {
  guild: Guild
  user: User
  voice?: VoiceBasedChannel | null
  text: GuildTextBasedChannel
  client: VkMusicBotClient
  interaction: ChatInputCommandInteraction<'cached'>
  respond: RespondFunction
  send: SendFunction
  message?: Message
  captcha?: CaptchaInfo
  meta: Meta
}

export default class {
  private readonly client: VkMusicBotClient

  constructor(client: VkMusicBotClient) {
    this.client = client
  }

  public async init() {
    const commandFiles = await globPromise('**/dist/slashCommands/*.js')

    for (const file of commandFiles) {
      const module = await import(`../${file}`)
      const command: CommandType = module.default

      this.client.commands.set(command.name, command)
      if (command.aliases) {
        command.aliases.forEach((alias: string) => {
          this.client.commands.set(alias, command)
        })
      }
    }

    this.client.on('interactionCreate', async (interaction) => {
      //console.log(interaction.options.data)
      if (!interaction.inCachedGuild()) return

      if (interaction.isChatInputCommand() || interaction.isButton() || interaction.isStringSelectMenu())
        this.executeSlash(interaction).catch((err) =>
          logger.error(
            {
              shard_id: this.client.cluster.id,
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
    const guild = interaction.guild as Guild
    const user = interaction.member?.user as User
    const member = interaction.member as GuildMember
    const text = interaction.channel
    const voice = member?.voice?.channel

    if (!text) return

    const meta: Meta = {
      shard_id: this.client.cluster.id,
      guild_id: guild?.id
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
            try {
              await interaction.deleteReply()
            } catch (err) {
              logger.error({ err, ...meta }, 'Error deleting reply')
            }
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

            try {
              if (message.deletable) await message.delete()
            } catch (err) {
              logger.error({ err, ...meta }, "Can't delete message")
            }
          }, timeout)
        }
      } catch (err) {
        logger.error({ err, ...meta }, "Can't send message")
      }
    }

    if (interaction.isCommand()) {
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
      if (await this.client.db.getAccessRoleEnabled(guild.id)) {
        const djRole = await this.client.db.getAccessRole(guild.id)

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
      if (command.premium && !(await this.client.db.checkPremium(guild.id))) {
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
          voice: member.voice.channel as VoiceBasedChannel,
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
      if (interaction?.customId.startsWith('queue')) {
        logger.info({ ...meta }, 'Queue button pressed')

        const page = parseInt(interaction?.customId.split('_')[1])

        if (page) {
          const player = this.client.kagazumo.getPlayer<CustomPlayer>(guild.id)
          await interaction.update(generateQueueResponse(page, player) as InteractionUpdateOptions)
        }
      }

      if (interaction?.customId.startsWith('menu')) {
        const id = interaction?.customId
        const player = this.client.kagazumo.getPlayer<CustomPlayer>(guild.id)

        if (!player) {
          await interaction.update(generateMenuResponse(player) as InteractionUpdateOptions)
          return
        }

        if (!voice) {
          await interaction.update(generateMenuResponse(player) as InteractionUpdateOptions)
          return
        }

        switch (id) {
          case MenuButtonType.Stop:
            player.setLoop('none')
            player.queue.clear()
            player.skip()
            break
          case MenuButtonType.Queue:
            await respond(generateQueueResponse(1, player) as InteractionReplyOptions)
            return
          case MenuButtonType.Skip:
            player.skip()
            break
          case MenuButtonType.Repeat:
            if (player.loop === 'none') {
              player.setLoop('track')
            } else if (player.loop === 'track') {
              player.setLoop('queue')
            } else if (player.loop === 'queue') {
              player.setLoop('none')
            }
            break
        }

        await interaction.update(generateMenuResponse(player) as InteractionUpdateOptions)
      }
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

          playCommand(partialParams as CommandExecuteParams, id).catch((err: any) =>
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
