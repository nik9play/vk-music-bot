import { Client, Collection } from 'discord.js'
import { Manager } from 'erela.js-vk'
import { readdirSync } from 'fs'

import colors from 'colors/safe'

import db from './tools/db/DBManager'

const client = new Client({
  messageCacheLifetime: 60,
  messageSweepInterval: 10
})

client.cooldowns = new Collection()
client.commands = new Collection()
client.captcha = new Collection()
client.prefixes = new Collection()
client.timers = new Collection()

const LavalinkServersString = process.env.LAVALINK_NODES
const nodes = LavalinkServersString.split(";").map(val => {
  const arr = val.split(",")
  return {
    name: arr[0],
    host: arr[1],
    port: parseInt(arr[2]),
    password: arr[3]
  }
})

const commandFiles = readdirSync('./src/commands').filter(file => file.endsWith('.js'))

for (const file of commandFiles) {
  import(`./commands/${file.replace('.js', '')}.js`).then(command => {
    client.commands.set(command.default.name, command.default)
    if (command.default.aliases) {
      command.default.aliases.forEach((e) => {
        client.commands.set(e, command.default)
      })
    }
  })
}

client.manager = new Manager({
  nodes,
  send: (id, payload) => {
    const guild = client.guilds.cache.get(id)
    if (guild) guild.shard.send(payload)
  }
})
  .on("nodeConnect", node => console.log(`Node "${node.options.identifier}" connected.`))
  .on("nodeError", (node, error) => console.log(
    `Node "${node.options.identifier}" encountered an error: ${error.message}.`
  ))
  .on("trackStart", async (player, track) => {
    if (!await client.db.getDisableAnnouncements(player.guild)) {
      const channel = client.channels.cache.get(player.textChannel)
      channel.send({embed: {
        description: `Сейчас играет **${track.author} — ${track.title}**.`,
        color: 0x5181b8
      }}).then(msg => { if (msg.deletable) msg.delete({timeout: track.duration}).catch(console.error) }).catch(console.error)
    }
  })
  // .on("trackEnd", async (player) => {
  //   if (!await client.db.get247(player.guild))
  //     if (player) {
  //       const voiceChannel = client.channels.cache.get(player.voiceChannel)
  //       const arr =  Array.from(voiceChannel.members.filter(m => m.user.bot == false).keys())
  //       if (!arr.length) {
  //         player.destroy()
  //         const channel = client.channels.cache.get(player.textChannel)
  //         channel.send({embed: {
  //           description: `**Я покинул канал, так как тут никого не осталось.** Хотите, чтобы я оставался? Включите режим 24/7 (доступен только для Премиум пользователей, подробности: \`-vdonate\`). `,
  //           color: 0x5181b8
  //         }}).then(msg => msg.delete({timeout: 30000}))
  //       }
  //     }
  // })
  .on("queueEnd", async (player) => {
    console.log("end of queue", player.guild)
    if (!await client.db.get247(player.guild))
      if (player)
        client.timers.set(player.guild, setTimeout(async () => {
          if (player) {
            player.destroy()
            const channel = client.channels.cache.get(player.textChannel)
            channel.send({embed: {
              description: `**Я покинул канал, так как слишком долго был неактивен.**\n Хотите, чтобы я оставался? Включите режим 24/7 (доступен только для Премиум пользователей, подробности: \`${await client.db.getPrefix(player.guild)}donate\`). `,
              color: 0x5181b8
            }}).then(msg => msg.delete({timeout: 30000}).catch(console.error)).catch(console.error)
          }
        }, 1200000))
  })
  .on("playerMove", (player, initChannel, newChannel) => {
    console.log(newChannel ? `${player.guild} moved player` : `${player.guild} disconnected`)
    if (!newChannel) { 
      if (client.timers.has(player.guild.id))
        clearTimeout(client.timers.get(player.guild.id))
      return player.destroy() 
    }
    setTimeout(() =>  player.pause(false), 2000)
  })
  .on("playerDestroy", (player) => {
    console.log(`${player.guild} player destroyed`)
  })
  .on("socketClosed", async (player, socket) => {
    // reconnect on "Abnormal closure"
    if (socket.code == 1006) {
      const voiceChannel = player.voiceChannel
      const textChannel = player.textChannel

      try {
        player.disconnect()
      } catch {
        //
      }

      setTimeout(() => {
        player.setVoiceChannel(voiceChannel)
        player.setTextChannel(textChannel)
  
        player.connect()
        setTimeout(() => {
          player.pause(false)
        }, 500)
      }, 500)
    }

    console.log("socket closed. info: ", socket, player.guild)
  })
  .on("trackStuck", (guildId) => {
    console.log(`${guildId} track stuck`)
  })
  .on("trackError", (player, track) => {
    const channel = client.channels.cache.get(player.textChannel)
    channel.send({embed: {
      description: `С треком **${track.author} — ${track.title}** произошла проблема, поэтому он был пропущен.`,
      color: 0x5181b8
    }}).then(msg => msg.delete({timeout: 30000}).catch(console.error)).catch(console.error)
    console.log(track)
  })

client.once("ready", () => {
  client.manager.init(client.user.id);
  console.log(`Logged in as ${client.user.tag}`)
})

client.on("raw", d => client.manager.updateVoiceState(d))

client.on("guildDelete", (guild) => {
  console.log(`${guild.id} leaves`)
  const player = client.manager.get(guild.id)

  if (player) player.destroy()

  if (client.timers.has(guild.id))
    clearTimeout(client.timers.get(guild.id))
})

client.login(process.env.DISCORD_TOKEN)

// подключение к дб
client.db = new db(process.env.MONGO_URL)
client.db.init()

client.on("message", async message => {
  if (message.channel.type != "text" || message.author.bot || !client.db.isConnected) return
  if (!message.channel.permissionsFor(message.client.user).has("SEND_MESSAGES")) return

  let prefix

  if (client.prefixes.has(message.guild.id))
    prefix = client.prefixes.get(message.guild.id)
  else {
    prefix = await client.db.getPrefix(message.guild.id)
    client.prefixes.set(message.guild.id, prefix)
  }

  if (message.mentions.users.has(client.user.id)) {
    return message.channel.send({
      embed: {
        title: "VK Music Bot",
        color: 0x5181b8,
        description: `Ваш текущий префикс: \`${prefix}\`. Чтобы узнать список команд, введите \`${prefix}h\`. Чтобы включить музыку, используйте \`${prefix}p\`.`
      }
    })
  }

  if (!message.content.startsWith(prefix)) return

  let args = message.content.slice(prefix.length).split(/ +/)
  const command = args.shift().toLowerCase()

  if (client.commands.has(command)) {
    console.log(`${colors.green(message.guild.shardID)}/${colors.red(message.guild.id)} выполнил ${colors.yellow.bold(command)} с аргументами ${colors.bold(args)}`)

    const commandHandler = client.commands.get(command)
    if (!client.cooldowns.has(commandHandler.name)) {
      client.cooldowns.set(commandHandler.name, new Collection())
    }
    
    //проверка кулдауна
    const now = Date.now()
    const timestamps = client.cooldowns.get(commandHandler.name)
    const cooldownAmount = (commandHandler.cooldown || 3) * 1000
    
    if (timestamps.has(message.author.id)) {
      const expirationTime = timestamps.get(message.author.id) + cooldownAmount

      if (now < expirationTime) {
        const timeLeft = (expirationTime - now) / 1000

        return message.reply(`пожалуйста, подождите еще ${timeLeft.toFixed(2)} секунд перед тем как использовать \`${commandHandler.name}\`!`)
          .then(msg => msg.delete({timeout: timeLeft * 1000 + 1000}))
      }
    } else {
      timestamps.set(message.author.id, now)
      setTimeout(() => timestamps.delete(message.author.id), cooldownAmount)
    }

    if (await client.db.getAccessRoleEnabled(message.guild.id)) {
      const djRole = await client.db.getAccessRole(message.guild.id)

      if (!message.member.roles.cache.some(role => role.name === djRole))
      return
    }

    if (commandHandler.premium)
      if (!await client.db.checkPremium(message.guild.id))
        return message.reply("на этом сервере нет **Премиума**, поэтому команда не может быть выполнена. Подробнее: `-vdonate`")

    if (commandHandler.adminOnly)
      if (message.member.permissions.has("MANAGE_GUILD"))
        return commandHandler.execute(message, args)
      else return

    commandHandler.execute(message, args)
  }
})