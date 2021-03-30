import { Client, Collection } from 'discord.js'
import { Manager } from 'erela.js-vk'
import { readdirSync } from 'fs'

import colors from 'colors/safe'

import ConfigDB from './tools/db/ConfigDB'

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
  import(`./commands/${file}`).then(command => {
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
  .on("trackStart", (player, track) => {
    const channel = client.channels.cache.get(player.textChannel)
    channel.send({embed: {
      description: `Сейчас играет **${track.author} — ${track.title}**.`,
      color: 0x5181b8
    }}).then(msg => msg.delete({timeout: track.duration}))
  })
  // .on("trackEnd", async (player) => {
  //   if (!await client.configDB.get247(player.guild))
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
    if (!await client.configDB.get247(player.guild))
      if (player)
        client.timers.set(player.guild, setTimeout(() => {
          if(player) {
            player.destroy()
            const channel = client.channels.cache.get(player.textChannel)
            channel.send({embed: {
              description: `**Я покинул канал, так как слишком долго был неактивен.**\n Хотите, чтобы я оставался? Включите режим 24/7 (доступен только для Премиум пользователей, подробности: \`-vdonate\`). `,
              color: 0x5181b8
            }}).then(msg => msg.delete({timeout: 30000}))
          }
        }, 1200000))
  })
  .on("playerMove", () => {
    console.log("moved player")
  })
  .on("playerDestroy", () => {
    console.log("player destroyed")
  })
  .on("socketClosed", (player, web) => {
    console.log("socket closed. info: ",web)
  })
  //.on("trackStuck")

client.once("ready", () => {
  client.manager.init(client.user.id);
  console.log(`Logged in as ${client.user.tag}`)
});

client.on("raw", d => client.manager.updateVoiceState(d))

client.login(process.env.DISCORD_TOKEN)

// подключение к дб
client.configDB = new ConfigDB(process.env.MONGO_URL)
client.configDB.init()

client.on("message", async message => {
  if (message.channel.type != "text" || message.author.bot || !client.configDB.isConnected) return
  if (!message.channel.permissionsFor(message.client.user).has("SEND_MESSAGES")) return

  let prefix

  if (client.prefixes.has(message.guild.id))
    prefix = client.prefixes.get(message.guild.id)
  else {
    prefix = await client.configDB.getPrefix(message.guild.id)
    client.prefixes.set(message.guild.id, prefix)
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

    if (await client.configDB.getAccessRoleEnabled(message.guild.id)) {
      const djRole = await client.configDB.getAccessRole(message.guild.id)

      if (!message.member.roles.cache.some(role => role.name === djRole))
      return
    }

    if (commandHandler.premium)
      if (!await client.configDB.checkPremium(message.guild.id))
        return message.reply("на этом сервере нет **Премиума**, поэтому команда не может быть выполнена. Подробнее: `-vdonate`")

    if (commandHandler.adminOnly)
      if (message.member.permissions.has("MANAGE_GUILD"))
        return commandHandler.execute(message, args)
      else return

    commandHandler.execute(message, args)
  }
})