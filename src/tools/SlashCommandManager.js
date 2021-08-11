import generateErrorMessage from './generateErrorMessage'
import axios from 'axios'
import colors from 'colors/safe'
import { readdirSync } from 'fs'

export default class {
  constructor(client) {
    this.client = client

    this.commandFiles = readdirSync('./src/slashCommands').filter(file => file.endsWith('.js'))

    for (const file of this.commandFiles) {
      import(`./slashCommands/${file.replace('.js', '')}.js`).then(command => {
        this.client.commands.set(command.default.name, command.default)
        if (command.default.aliases) {
          command.default.aliases.forEach((e) => {
            this.client.commands.set(e, command.default)
          })
        }
      })
    }

    // слэш команды и кнопки
    this.client.on('interactionCreate', async interaction => {
      console.log(interaction.token)
      
      this.executeSlash(interaction)
    })

    // обычные команды с префиксом
    this.client.on('messageCreate', async message => {
      // this.executePrefix(message)
    })
  }

  async executeSlash(interaction) {
    const allowedTypes = [2, 3]

    if (interaction.isCommand()) {
      const guild = interaction.guild
      const user = interaction.member.user
      const text = interaction.channel

      const command = this.client.commands.get(interaction.commandName)

      const respond = (data, timeout) => {
        interaction.reply(data).catch(err => console.error('Can\'t send reply: ', err))
        
        if (timeout)
          setTimeout(() => {
            interaction.deleteReply().catch(console.error)
          }, timeout)
      }

      const send = data => {
        return text.send(data).catch(err => console.error('Can\'t send message: ', err))
      }

      if (command.premium && !await this.client.db.checkPremium(guild.id)) {
        respond({ embed:generateErrorMessage('Для выполнения этой команды требуется **Премиум**! Подробности: /donate.'), ephemeral: true })
        return
      }

      const args = interaction?.options.data.map(el => {
        return el?.value
      }) ?? []

      command.execute({ 
        guild,
        user,
        voice: user?.voice.channel,
        text,
        client: this.client,
        args,
        respond,
        send
      })
    }

    

    if (allowedTypes.includes(interaction.type)) {
      const guild = await this.client.guilds.fetch(interaction.guild_id)
      const user = guild.members.cache.get(interaction.member.user.id)
      const text = guild.channels.cache.get(interaction.channel_id)

      const command = this.client.commands.get(interaction.data.name)

      const respond = (content, type='embed', components, timeout) => {
        let data
        if (type === 'embed') {
          data = {
            embeds: [content]
          }
        } else if (type === 'text') {
          data = {
            content
          }
        }
        
        data = { ...data, components }

        this.client.api.interactions(interaction.id, interaction.token).callback.post({data: {
          type: 4,
          data
        }})
        
        if (timeout)
          setTimeout(() => {
            axios.delete(`https://discordapp.com/api/webhooks/${this.client.user.id}/${interaction.token}/messages/@original`)
              .catch(err => console.error('Cant delete response message', err))
          }, timeout)
      }

      const send = data => {
        return text.send(data).catch(err => console.error('Cant send message', err))
      }

      if (interaction.type === 2) {
        if (command.premium && !await this.client.db.checkPremium(guild.id)) {
          respond(generateErrorMessage('Для выполнения этой команды требуется **Премиум**! Подробности: /donate.'))
          return
        }
  
        const args = interaction.data.options?.map(el => {
          return el.value
        }) ?? []
  
        command.execute({ 
          guild,
          user,
          voice: user?.voice.channel,
          text,
          client: this.client,
          args,
          respond,
          send
        })
      }

      if (interaction.type === 3) {
        // обработка кнопки с поиска
        if (interaction.data.custom_id.startsWith('search')) {
          const id = interaction.data.custom_id.split(',')[1]
  
          const commandPlay = this.client.commands.get('play')

          commandPlay.execute({ 
            guild,
            user,
            voice: user?.voice.channel,
            text,
            client: this.client,
            args: [id],
            respond,
            send
          })
        }
      }
    }
  }

  async executePrefix(message) {
    if (message.channel.type != 'text' || message.author.bot || !this.client.db.isConnected) return
    if (!message.channel.permissionsFor(message.client.user).has('SEND_MESSAGES')) return
  
    let prefix = await this.client.db.getPrefix(message.guild.id)
  
    if (message.mentions.users.has(this.client.user.id)) {
      return message.channel.send({
        embed: {
          title: 'VK Music Bot',
          color: 0x5181b8,
          description: `Ваш текущий префикс: \`${prefix}\`. Чтобы узнать список команд, введите \`${prefix}h\`. Чтобы включить музыку, используйте \`${prefix}p\`.`
        }
      })
    }
  
    if (!message.content.startsWith(prefix)) return
  
    let args = message.content.slice(prefix.length).split(/ +/)
    const command = args.shift().toLowerCase()
    
    if (this.client.commands.has(command)) {
      console.log(`${colors.green(message.guild.shardID)}/${colors.red(message.guild.id)} выполнил ${colors.yellow.bold(command)} с аргументами ${colors.bold(args)}`)
      
      const { guild, member, channel } = message
      
      const respond = async (content, type='embed', components, timeout) => {
        let data
        if (type === 'embed') {
          data = {
            embeds: [content]
          }
        } else if (type === 'text') {
          data = {
            content
          }
        }
        
        data = { ...data, components }

        const messsage = await this.client.api.channels[channel.id].messages.post({ data })
        
        if (timeout)
          setTimeout(() => {
            // axios.delete(`https://discordapp.com/api/webhooks/${this.client.user.id}/${interaction.token}/messages/@original`)
            //   .catch(err => console.error('Cant delete response message', err))
            this.client.api.channels[channel.id].messages[messsage.id].delete().catch(console.error)
          }, timeout)
      }

      const send = data => {
        return channel.send(data).catch(err => console.error('Cant send message', err))
      }

      this.client.commands.get(command).execute({ 
        guild,
        user: member,
        voice: member?.voice.channel,
        text: channel,
        client: this.client,
        args,
        respond,
        send
      })
    }
  }

}