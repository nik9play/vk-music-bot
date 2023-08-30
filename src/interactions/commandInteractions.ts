import {
  ChatInputCommandInteraction,
  Collection,
  EmbedBuilder,
  Events,
  Interaction,
  PermissionsBitField,
  SlashCommandBuilder
} from 'discord.js'
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
  adminOnly?: boolean
  premium?: boolean
  cooldown?: number
  djOnly?: boolean
  deferred?: boolean
  dev?: boolean
  data: SlashCommandBuilder
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
      guild_id: guild?.id,
      shard_id: guild?.shardId
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

    if (config.djMode && command.djOnly) {
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

    // проверка условий
    // if (command.conditions) {
    //   if (command.conditions.includes(ExecuteConditions.Player)) {
    //     if (!player) {
    //       await Utils.sendNoPlayerMessage(respond)
    //       return
    //     }
    //   }

    //   if (command.conditions.includes(ExecuteConditions.VoicePermissions)) {
    //     if (!voice) {
    //       await Utils.sendNoVoiceChannelMessage(respond)
    //       return
    //     }

    //     if (!Utils.checkVoicePermissions(voice)) {
    //       await respond({
    //         embeds: [Utils.generateErrorMessage('Мне нужны права, чтобы войти в канал.')],
    //         ephemeral: true
    //       })
    //       return
    //     }
    //   }

    //   if (command.conditions.includes(ExecuteConditions.SameVoiceChannel)) {
    //     if (voice?.id !== guild.members.me?.voice.id) {
    //       await Utils.sendWrongChannel(respond)
    //       return
    //     }
    //   }
    // }

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
        const embed = new EmbedBuilder()
          .setDescription(
            'Ошибка! Требуется капча. Введите команду </captcha:906533763033464832>, а после введите код с картинки. ' +
              `Если картинки не видно, перейдите по [ссылке](${captcha?.url})` +
              '\nЕсли хотите видеть капчу реже, приобретите **Премиум**. Подробности: </donate:906533685979918396>'
          )
          .setColor(0x235dff)
          .setImage(captcha.url + Utils.generateRandomCaptchaString())

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
        const errorId = Utils.generateErrorId()
        logger.error({ err, ...meta, errorId }, 'Error executing command')

        await respond({
          embeds: [
            new EmbedBuilder()
              .setDescription(
                'Произошла непредвиденная ошибка. Обратитесь за поддержкой в' +
                  ' [группу ВК](https://vk.com/vkmusicbotds) или на [сервер Discord](https://discord.com/invite/3ts2znePu7).'
              )
              .setFooter({ text: `ID ошибки: ${errorId}` })
              .setColor(0xed4245)
          ]
        }).catch((err) =>
          logger.error({ err, error_id: errorId }, 'Error while sending error message')
        )
      })
  }
}
