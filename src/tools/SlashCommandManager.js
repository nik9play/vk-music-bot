import generateErrorMessage from './generateErrorMessage'
import { readdirSync } from 'fs'
import { Permissions } from 'discord.js'
import logger from './logger'

export default class {
  constructor(client) {
    this.client = client

    const commandFiles = readdirSync('./src/slashCommands').filter(file => file.endsWith('.js'))

    for (const file of commandFiles) {
      import(`../slashCommands/${file.replace('.js', '')}.js`).then(command => {
        this.client.commands.set(command.default.name, command.default)
        if (command.default.aliases) {
          command.default.aliases.forEach((e) => {
            this.client.commands.set(e, command.default)
          })
        }
      })
    }

    const slashOverwrites = readdirSync('./src/slashOverwrites').filter(file => file.endsWith('.js'))

    for (const file of slashOverwrites) {
      import(`../slashOverwrites/${file.replace('.js', '')}.js`).then(command => {
        this.client.slashOverwrites.set(command.default.name, command.default)
      })
    }

    // слэш команды и кнопки
    this.client.on('interactionCreate', async interaction => {
      //console.log(interaction.options.data)
      
      this.executeSlash(interaction)
    })

    // обычные команды с префиксом
    this.client.on('messageCreate', async message => {
      //console.log(message)
      this.executePrefix(message)
    })
  }

  /*
   * Слэш команды
   */
  async executeSlash(interaction) {
    if (interaction.isCommand() || interaction.isButton()) {
      const guild = interaction.guild
      const user = interaction.member.user
      const member = interaction.member
      const text = interaction.channel
      
      let command
      if (this.client.slashOverwrites.has(interaction.commandName)) {
        command = this.client.slashOverwrites.get(interaction.commandName)
      } else {
        command = this.client.commands.get(interaction.commandName)
      }

      const respond = (data, timeout) => {
        interaction.reply(data).catch(err => logger.log('error', 'Can\'t send reply: %O', err))
        
        if (timeout)
          setTimeout(() => {
            interaction.deleteReply().catch(err => logger.log('error', err))
          }, timeout)
      }

      const send = async (data, timeout) => {
        const message = await text.send(data).catch(err => logger.log('error', 'Can\'t send message: %O', err))

        if (timeout)
          setTimeout(() => {
            message.delete().catch(err => logger.log('error', 'Can\'t delete message: %O', err))
          }, timeout)
      }

      if (interaction.isCommand()) {
        // проверка на админа
        if (command.adminOnly) {
          if (!member.permissions.has(Permissions.FLAGS.MANAGE_GUILD)) {
            respond({ embeds: [generateErrorMessage('Эту команду могут выполнять только пользователи с правом `Управление сервером`.')], ephemeral: true })
            return
          }
        }

        // проверка на dj роль
        if (await this.client.db.getAccessRoleEnabled(guild.id)) {
          const djRole = await this.client.db.getAccessRole(guild.id)
    
          if (!member.permissions.has(Permissions.FLAGS.MANAGE_GUILD) && !member.roles.cache.some(role => role.name === djRole)) {
            respond({ embeds: [generateErrorMessage(`Сейчас включен DJ режим, и вы не можете выполнять команды, так как у вас нет роли \`${djRole}\`.`)], ephemeral: true })
            return
          }
        }
        
        // проверка на премиум
        if (command.premium && !await this.client.db.checkPremium(guild.id)) {
          respond({ embeds: [generateErrorMessage('Для выполнения этой команды требуется **Премиум**! Подробности: /donate.')], ephemeral: true })
          return
        }

        const args = interaction?.options.data.map(el => {
          return el?.value
        }) ?? []
        
        logger.log('info', `${guild.shardId}/${guild.id} выполнил ${command.name} с аргументами %O`, args)

        if (this.client.captcha.has(guild.id) && (command.name === 'play' || command.name === 'search')) {
          const captcha = this.client.captcha.get(guild.id)
          const embed = {
            description: 'Ошибка! Ожидается команда, для которой не введена капча. Введите команду `/captcha`, а после код с картинки.' +
            `Если картинки не видно, перейдите по [ссылке](${captcha.url})`,
            color: 0x5181b8,
            image: {
              url: captcha.url
            }
          }
  
          return respond({ embeds: [embed], ephemeral: true })
        }

        command.execute({ 
          guild,
          user,
          voice: member?.voice?.channel,
          text,
          client: this.client,
          args,
          interaction,
          respond,
          send
        }).catch(err => logger.log('error', 'Error executing command: %O', err))
      }

      if (interaction.isButton()) {
        if (interaction?.customId.startsWith('search')) {
          const id = interaction.customId.split(',')[1]

          if (id) {
            const commandPlay = this.client.commands.get('play')

            commandPlay.execute({ 
              guild,
              user,
              voice: member?.voice?.channel,
              text,
              client: this.client,
              args: [id],
              respond,
              send
            }).catch(err => logger.log('error', 'Error executing command: %O', err))
          }
        }
      }
    }
  }

  /*
   * Обычные команды
   */
  async executePrefix(message) {
    if (message.channel.type != 'GUILD_TEXT' || message.author.bot || !this.client.db.isConnected) return
    if (!message.channel.permissionsFor(message.client.user).has(Permissions.FLAGS.SEND_MESSAGES)) return
  
    const prefix = await this.client.db.getPrefix(message.guild.id)
  
    // if (message.mentions.users.has(this.client.user.id)) {
    //   return message.channel.send({
    //     embed: {
    //       title: 'VK Music Bot',
    //       color: 0x5181b8,
    //       description: `Ваш текущий префикс: \`${prefix}\`. Чтобы узнать список команд, введите \`${prefix}h\`. Чтобы включить музыку, используйте \`${prefix}p\`.`
    //     }
    //   })
    // }
  
    if (!message.content.startsWith(prefix)) return
  
    let args = message.content.slice(prefix.length).split(/ +/)
    const commandName = args.shift().toLowerCase()
    
    if (this.client.commands.has(commandName)) {      
      logger.log('info', `${message.guild.shardId}/${message.guild.id} выполнил ${commandName} с аргументами %O`, args)

      const { guild, member, channel } = message
      
      const respond = async (data, timeout) => {
        const message = await channel.send(data).catch(err => logger.log('error', 'Can\'t send message: %O', err))

        if (timeout)
          setTimeout(() => {
            message.delete().catch(err => logger.log('error', 'Can\'t delete message: %O', err))
          }, timeout)
      }

      const send = respond

      const command = this.client.commands.get(commandName)

      // проверка на админа
      if (command.adminOnly) {
        if (!member.permissions.has(Permissions.FLAGS.MANAGE_GUILD)) {
          respond({ embeds: [generateErrorMessage('Эту команду могут выполнять только пользователи с правом `Управление сервером`.')], ephemeral: true })
          return
        }
      }

      // проверка на dj роль
      if (await this.client.db.getAccessRoleEnabled(guild.id)) {
        const djRole = await this.client.db.getAccessRole(guild.id)
  
        if (!member.permissions.has(Permissions.FLAGS.MANAGE_GUILD) && !member.roles.cache.some(role => role.name === djRole)) {
          respond({ embeds: [generateErrorMessage(`Сейчас включен DJ режим, и вы не можете выполнять команды, так как у вас нет роли \`${djRole}\`.`)], ephemeral: true })
          return
        }
      }
      
      // проверка на наличие премиума
      if (command.premium && !await this.client.db.checkPremium(guild.id)) {
        respond({ embeds: [generateErrorMessage(`Для выполнения этой команды требуется **Премиум**! Подробности: \`${await this.client.db.getPrefix(guild.id)}donate\``)], ephemeral: true })
        return
      }

      // проверка на наличие капчи
      if (this.client.captcha.has(guild.id) &&
         (command.name === 'play' || command.name === 'search')) {
        const captcha = this.client.captcha.get(guild.id)
        const embed = {
          description: `Ошибка! Ожидается команда, для которой не введена капча. Введите команду \`${await this.client.db.getPrefix(guild.id)}captcha\`, а после код с картинки.` +
          `Если картинки не видно, перейдите по [ссылке](${captcha.url})`,
          color: 0x5181b8,
          image: {
            url: captcha.url
          }
        }

        respond({ embeds: [embed], ephemeral: true })
        return
      }

      command.execute({ 
        guild,
        user: member.user,
        voice: member?.voice?.channel,
        text: channel,
        client: this.client,
        args,
        respond,
        send,
        message
      }).catch(err => logger.log('error', 'Error executing command: %O', err))
    }
  }

}