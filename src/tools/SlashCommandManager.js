import generateErrorMessage from "./generateErrorMessage"
import { WebhookClient } from "discord.js"

export default class {
  constructor(client) {
    this.client = client

    this.client.ws.on('INTERACTION_CREATE', async interaction => {
      console.log(interaction.data)
      
      this.execute(interaction)
    })
  }

  async execute(interaction) {
    if (interaction.type === 2) {
      const guild = await this.client.guilds.fetch(interaction.guild_id)
      const user = guild.members.cache.get(interaction.member.user.id)
      const text = guild.channels.cache.get(interaction.channel_id)

      const command = this.client.commands.get(interaction.data.name)

      const respond = (content, type='embed') => {
        let data
        if (type === 'embed')
          data = {
            embeds: [content]
          }
        else if (type === 'text')
          data = {
            content
          }

        this.client.api.interactions(interaction.id, interaction.token).callback.post({data: {
          type: 4,
          data
        }})
      }

      const send = (data) => {
        return text.send(data).catch(console.error)
      }

      if (command.premium && !await this.client.db.checkPremium(guild.id)) {
        respond(generateErrorMessage('Для выполнения этой команды требуется **Премиум**! Подробности: /donate.'))
        return
      }

      const args = interaction.data.options?.map(el => {
        return el.value
      })

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
    } else {
      throw "Wrong type"
    } 
  }


}