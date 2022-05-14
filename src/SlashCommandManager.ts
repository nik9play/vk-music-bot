import {
  ButtonInteraction,
  CommandInteraction,
  Guild,
  GuildMember,
  InteractionReplyOptions,
  InteractionUpdateOptions,
  Message,
  MessageOptions,
  Permissions,
  TextBasedChannel,
  User,
  VoiceBasedChannel
} from 'discord.js'
import logger from './Logger'
import Collection from '@discordjs/collection'
import { CaptchaInfo, VkMusicBotClient } from './client'
import Utils, { ErrorMessageType } from './Utils'
import glob from 'glob'
import { promisify } from 'util'
import { generateQueueResponse } from './helpers/QueueCommandHelper'

const globPromise = promisify(glob)

export interface Meta {
  guild_id?: string,
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

type RespondFunction = (data: MessageOptions | InteractionReplyOptions, timeout?: number) => Promise<void>
type SendFunction = (data: MessageOptions, timeout?: number) => Promise<void>

export interface CommandExecuteParams {
  guild: Guild,
  user: User,
  voice: VoiceBasedChannel,
  text: TextBasedChannel,
  client: VkMusicBotClient,
  args: string[],
  interaction?: CommandInteraction,
  respond: RespondFunction,
  send: SendFunction,
  message?: Message,
  captcha?: CaptchaInfo,
  meta: Meta
}

export default class {
  private client: VkMusicBotClient

  constructor(client: VkMusicBotClient) {
    this.client = client
  }

  public async init() {
    logger.info('Loading commands...')
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

    logger.info('Loading commands overwrites...')
    const overwritesFiles = await globPromise('**/dist/slashOverwrites/*.js')

    for (const file of overwritesFiles) {
      const module = await import(`../${file}`)
      const command: CommandType = module.default

      this.client.slashOverwrites.set(command.name, command)
    }

    this.client.on('interactionCreate', async interaction => {
      //console.log(interaction.options.data)
      if (interaction.isCommand() || interaction.isButton())
        this.executeSlash(interaction).catch((err) => logger.error({
          shard_id: this.client.cluster.id,
          err
        }, 'executeSlash'))
    })

    // обычные команды с префиксом
    this.client.on('messageCreate', async message => {
      //console.log(message)
      this.executePrefix(message).catch((err) => logger.error({
        shard_id: this.client.cluster.id,
        err
      }, 'executePrefix'))
    })
  }

  /*
   * Слэш команды
   */
  async executeSlash(interaction: CommandInteraction | ButtonInteraction) {
    const guild = interaction.guild as Guild
    const user = interaction.member?.user as User
    const member = interaction.member as GuildMember
    const text = interaction.channel as TextBasedChannel

    const meta: Meta = {
      shard_id: this.client.cluster.id,
      guild_id: guild?.id
    }

    const respond = async (data: MessageOptions | InteractionReplyOptions, timeout?: number): Promise<void> => {
      if (interaction.deferred)
        await interaction.editReply(data).catch(err => logger.error({ err, ...meta }, 'Can\'t edit reply'))
      else
        await interaction.reply(data as InteractionReplyOptions).catch(err => logger.error({ err, ...meta }, 'Can\'t send reply'))

      if (timeout)
        setTimeout(async () => {
          await interaction.deleteReply().catch(err => logger.error({ err, ...meta }, 'Error deleting reply'))
        }, timeout)
    }

    const send = async (data: MessageOptions, timeout?: number): Promise<void> => {
      const message = await text.send(data).catch(err => logger.error({ err, ...meta }, 'Can\'t send message'))

      if (timeout)
        setTimeout(async () => {
          if (message && typeof message.delete === 'function') {
            await message.delete().catch(err => logger.error({ err, ...meta }, 'Can\'t delete message'))
          }
        }, timeout)
    }

    if (interaction.isCommand()) {
      let command: CommandType

      if (this.client.slashOverwrites.has(interaction.commandName)) {
        command = this.client.slashOverwrites.get(interaction.commandName) as CommandType
      } else {
        command = this.client.commands.get(interaction.commandName) as CommandType
      }

      if (!command) {
        await respond({
          content: 'Неизвестная команда'
        })
        return
      }

      // редактировать ответ если команда отложена
      if (command.deferred && !interaction.deferred)
        await interaction.deferReply()

      // проверка на админа
      if (command.adminOnly && !member.permissions.has(Permissions.FLAGS.MANAGE_GUILD)) {
        await respond({
          embeds: [Utils.generateErrorMessage('Эту команду могут выполнять только пользователи с правом `Управление сервером`.')],
          ephemeral: true
        })
        return
      }

      // проверка на dj роль
      if (await this.client.db.getAccessRoleEnabled(guild.id)) {
        const djRole = await this.client.db.getAccessRole(guild.id)

        if (!member.permissions.has(Permissions.FLAGS.MANAGE_GUILD) && !member.roles.cache.some(role => role.name === djRole)) {
          await respond({
            embeds: [Utils.generateErrorMessage(`Сейчас включен DJ режим, и вы не можете выполнять команды, так как у вас нет роли \`${djRole}\`.`)],
            ephemeral: true
          })
          return
        }
      }

      // проверка на премиум
      if (command.premium && !await this.client.db.checkPremium(guild.id)) {
        await respond({
          embeds: [Utils.generateErrorMessage('Для выполнения этой команды требуется **Премиум**! Подробности: /donate.')],
          ephemeral: true
        })
        return
      }

      const args: string[] = interaction.options.data.map((el): string => {
        if (el.value)
          return el.value.toString()
        return ''
      }) ?? []

      logger.info({ args, ...meta }, `Executed command ${command.name} with arguments`)

      if (command.name === 'play' || command.name === 'search') {
        const captcha = this.client.captcha.get(guild.id)

        if (captcha) {
          const embed = {
            description: 'Ошибка! Ожидается команда, для которой не введена капча. Введите команду `/captcha`, а после код с картинки.' +
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

      command.execute({
        guild,
        user,
        voice: member.voice.channel as VoiceBasedChannel,
        text,
        client: this.client,
        args,
        interaction,
        respond,
        send,
        meta
      }).catch(err => logger.error({ err, ...meta }, 'Error executing command'))
    }

    if (interaction.isButton()) {
      if (interaction?.customId.startsWith('search')) {
        logger.info({ ...meta }, 'Search button pressed')

        const id = interaction.customId.split(',')[1]

        if (id) {
          const commandPlay = this.client.commands.get('play')

          // редактировать ответ если команда отложена
          if (!interaction.deferred)
            await interaction.deferReply()

          commandPlay?.execute({
            guild,
            user,
            voice: member?.voice?.channel as VoiceBasedChannel,
            text,
            client: this.client,
            args: [id],
            respond,
            send,
            meta
          }).catch((err: any) => logger.error({ err, ...meta }, 'Error executing command from button'))
        }
      }

      if (interaction?.customId.startsWith('queue')) {
        logger.info({ ...meta }, 'Queue button pressed')

        const page = parseInt(interaction?.customId.split('_')[1])

        if (page) {
          const player = this.client.manager.get(guild.id)
          await interaction.update(generateQueueResponse(page, player) as InteractionUpdateOptions)
        }
      }
    }
  }

  /*
   * Обычные команды
   */
  async executePrefix(message: Message): Promise<void> {
    if (message.channel.type != 'GUILD_TEXT' || message.author.bot) return
    if (!message.channel.permissionsFor(message.client.user as User)?.has(Permissions.FLAGS.SEND_MESSAGES)) return

    const prefix = await this.client.db.getPrefix(message.guild?.id.toString())

    if (!message.content.startsWith(prefix)) return

    const args = message.content.slice(prefix.length).split(/ +/)

    // eslint-disable-next-line @typescript-eslint/ban-ts-comment
    // @ts-ignore
    const commandName = args.shift().toLowerCase()

    if (this.client.commands.has(commandName)) {
      const guild = message.guild as Guild
      const member = message.member as GuildMember
      const channel = message.channel as TextBasedChannel

      const meta = {
        shard_id: this.client.cluster.id,
        guild_id: guild.id
      }

      logger.info({ args, ...meta }, `Executed command ${commandName} with arguments`)

      const respond = async (data: MessageOptions | InteractionReplyOptions, timeout?: number): Promise<void> => {
        try {
          const message = await channel.send(data as MessageOptions)

          if (timeout)
            setTimeout(() => {
              if (message) {
                message.delete().catch(err => logger.error({ err }, 'Can\'t delete message'))
              }
            }, timeout)
        } catch (err) {
          logger.error({ err }, 'Can\'t delete message')
        }
      }

      const send = respond

      const command = this.client.commands.get(commandName)

      // проверка на админа
      if (command?.adminOnly) {
        if (!member.permissions.has(Permissions.FLAGS.MANAGE_GUILD)) {
          await respond({
            embeds: [Utils.generateErrorMessage('Эту команду могут выполнять только пользователи с правом `Управление сервером`.')]
          })
          return
        }
      }

      // проверка на dj роль
      if (await this.client.db.getAccessRoleEnabled(guild.id)) {
        const djRole = await this.client.db.getAccessRole(guild.id)

        if (!member.permissions.has(Permissions.FLAGS.MANAGE_GUILD) && !member.roles.cache.some(role => role.name === djRole)) {
          await respond({
            embeds: [Utils.generateErrorMessage(`Сейчас включен DJ режим, и вы не можете выполнять команды, так как у вас нет роли \`${djRole}\`.`)]
          })
          return
        }
      }

      // проверка на наличие премиума
      if (command?.premium && !await this.client.db.checkPremium(guild.id)) {
        await respond({
          embeds: [Utils.generateErrorMessage(`Для выполнения этой команды требуется **Премиум**! Подробности: \`${await this.client.db.getPrefix(guild.id)}donate\``)]
        })
        return
      }

      // проверка на наличие капчи
      if (command?.name === 'play' || command?.name === 'search') {
        const captcha = this.client.captcha.get(guild.id)

        if (captcha) {
          const embed = {
            description: `Ошибка! Ожидается команда, для которой не введена капча. Введите команду \`${await this.client.db.getPrefix(guild.id)}captcha\`, а после код с картинки.` +
              `Если картинки не видно, перейдите по [ссылке](${captcha.url})`,
            color: 0x5181b8,
            image: {
              url: captcha.url + Utils.generateRandomCaptchaString()
            }
          }

          await respond({ embeds: [embed] })
          return
        }
      }

      const realCommandName = command?.name as string

      //проверка кулдауна
      if (!this.client.cooldowns.has(realCommandName)) {
        this.client.cooldowns.set(realCommandName, new Collection())
      }

      const now = Date.now()
      const timestamps = this.client.cooldowns.get(realCommandName)
      const cooldownAmount = (command?.cooldown || 3) * 1000

      if (timestamps.has(member.user.id)) {
        const expirationTime = timestamps.get(member.id) + cooldownAmount

        if (now < expirationTime) {
          const timeLeft = (expirationTime - now) / 1000

          await respond({
            embeds: [Utils.generateErrorMessage(`Пожалуйста, подождите еще ${timeLeft.toFixed(2)} секунд перед тем как использовать \`${realCommandName}\`!`,
              ErrorMessageType.Warning)]
          },
          timeLeft * 1000 + 1000)
          return
        }
      } else {
        timestamps.set(member.id, now)
        setTimeout(() => timestamps.delete(member.id), cooldownAmount)
      }

      await command?.execute({
        guild,
        user: member.user,
        voice: member?.voice?.channel as VoiceBasedChannel,
        text: channel,
        client: this.client,
        args,
        respond,
        send,
        message,
        meta
      }).catch(err => logger.error({ err, ...meta }, 'Error executing command'))
    }
  }

}