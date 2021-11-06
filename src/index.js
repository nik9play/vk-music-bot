import { Client, Collection, Intents, Options } from 'discord.js'
import { Manager } from 'erela.js-vk'

import db from './tools/db/DBManager'
import getExitTimeout from './tools/getExitTimeout'
import SlashCommandManager from './tools/SlashCommandManager'
import logger from './tools/logger'

const client = new Client({
  makeCache: Options.cacheWithLimits({
		MessageManager: {
      sweepInterval: 30,
      maxSize: 100
    },
		PresenceManager: 0,
    ThreadManager: 0
	}),
  intents: [ Intents.FLAGS.GUILDS, Intents.FLAGS.GUILD_VOICE_STATES, Intents.FLAGS.GUILD_MESSAGES ]
})

new SlashCommandManager(client)

client.cooldowns = new Collection()
client.commands = new Collection()
client.slashOverwrites = new Collection() 
client.captcha = new Collection()
client.timers = new Collection()

const LavalinkServersString = process.env.LAVALINK_NODES
const nodes = LavalinkServersString.split(';').map(val => {
  const arr = val.split(',')
  return {
    name: arr[0],
    host: arr[1],
    port: parseInt(arr[2]),
    password: arr[3]
  }
})

client.manager = new Manager({
  nodes,
  send: (id, payload) => {
    const guild = client.guilds.cache.get(id)
    if (guild) guild.shard.send(payload)
  }
})
  .on('nodeConnect', node => logger.log('info', `Node "${node.options.identifier}" connected.`, {metadata: {shard: client.shard.ids[0]}}))
  .on('nodeError', (node, error) => logger.log('error', 
    `Node "${node.options.identifier}" encountered an error: ${error.message}.`
  ))
  .on('trackStart', async (player, track) => {
    if (!await client.db.getDisableAnnouncements(player.guild)) {
      const channel = client.channels.cache.get(player.textChannel)

      if (channel) {
        const message = await channel.send({embeds: [{
          description: `Сейчас играет **${track.author} — ${track.title}**.`,
          color: 0x5181b8
        }]}).catch(err => logger.log('error', 'Can\'t send message: %O', err))
        if (message) {
          try {
            setTimeout(() => {
              message?.delete().catch(err => logger.log('error', 'Can\'t delete message: %O', err))
            }, track.duration)
          }
          catch { // 
          }
        }

      }
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
  .on('queueEnd', async (player) => {
    logger.log('info', 'end of queue', {metadata:{guild_id: player.guild, shard: client.shard.ids[0]}})
    if (!await client.db.get247(player.guild))
      if (player) {
        logger.log('info', 'set timeout', {metadata:{guild_id: player.guild, shard: client.shard.ids[0]}})
        client.timers.set(player.guild, getExitTimeout(player, client))
      }
  })
  .on('playerMove', (player, initChannel, newChannel) => {
    logger.log('info', newChannel ? 'moved player' : 'disconnected', {metadata:{guild_id: player.guild, shard: client.shard.ids[0]}})
    if (!newChannel) { 
      if (client.timers.has(player.guild.id))
        clearTimeout(client.timers.get(player.guild.id))
      return player.destroy() 
    }
    setTimeout(() =>  player.pause(false), 2000)
  })
  .on('playerDestroy', (player) => {
    logger.log('info', 'player destroyed', {metadata:{guild_id: player.guild, shard: client.shard.ids[0]}})
  })
  .on('socketClosed', async (player, socket) => {
    // reconnect on "Abnormal closure"
    if (socket.code == 1006) {
      logger.log('notice', 'caught Abnormal closure, trying to reconnect...', {metadata:{guild_id: player.guild, shard: client.shard.ids[0]}})
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

    logger.log('debug', 'socket closed. info: %O, %s', socket, player.guild)
  })
  .on('trackStuck', (guildId) => {
    logger.log('notice', 'track stuck', {metadata:{guild_id: guildId, shard: client.shard.ids[0]}})
  })
  .on('trackError', (player, track) => {
    // const channel = client.channels.cache.get(player.textChannel)
    // channel.send({embed: {
    //   description: `С треком **${track.author} — ${track.title}** произошла проблема, поэтому он был пропущен.`,
    //   color: 0x5181b8
    // }}).then(msg => msg.delete({timeout: 30000}).catch(console.error)).catch(console.error)
    logger.log('warn', 'Track error: %O, %O', player, track, {metadata:{guild_id: player.guild, shard: client.shard.ids[0]}})
  })


client.once('ready', () => {
  client.manager.init(client.user.id)
  logger.log('info', `Logged in as ${client.user.tag}`, {metadata:{shard: client.shard.ids[0]}})
})

client.on('raw', d => client.manager.updateVoiceState(d))

client.on('guildDelete', (guild) => {
  logger.log('info', 'bot leaves', {metadata:{guild_id: guild.id, shard: client.shard.ids[0]}})
  const player = client.manager.get(guild.id)

  if (player) player.destroy()

  if (client.timers.has(guild.id))
    clearTimeout(client.timers.get(guild.id))
})

client.login(process.env.DISCORD_TOKEN)

// подключение к дб
client.db = new db(process.env.MONGO_URL, process.env.REDIS_URL)
client.db.init()

// client.on("message", async message => {
//   if (message.channel.type != "text" || message.author.bot || !client.db.isConnected) return
//   if (!message.channel.permissionsFor(message.client.user).has("SEND_MESSAGES")) return

//   let prefix = await client.db.getPrefix(message.guild.id)

//   if (message.mentions.users.has(client.user.id)) {
//     return message.channel.send({
//       embed: {
//         title: "VK Music Bot",
//         color: 0x5181b8,
//         description: `Ваш текущий префикс: \`${prefix}\`. Чтобы узнать список команд, введите \`${prefix}h\`. Чтобы включить музыку, используйте \`${prefix}p\`.`
//       }
//     })
//   }

//   if (!message.content.startsWith(prefix)) return

//   let args = message.content.slice(prefix.length).split(/ +/)
//   const command = args.shift().toLowerCase()

//   if (client.commands.has(command)) {
//     console.log(`${colors.green(message.guild.shardID)}/${colors.red(message.guild.id)} выполнил ${colors.yellow.bold(command)} с аргументами ${colors.bold(args)}`)

//     const commandHandler = client.commands.get(command)
//     if (!client.cooldowns.has(commandHandler.name)) {
//       client.cooldowns.set(commandHandler.name, new Collection())
//     }
    
//     //проверка кулдауна
//     const now = Date.now()
//     const timestamps = client.cooldowns.get(commandHandler.name)
//     const cooldownAmount = (commandHandler.cooldown || 3) * 1000
    
//     if (timestamps.has(message.author.id)) {
//       const expirationTime = timestamps.get(message.author.id) + cooldownAmount

//       if (now < expirationTime) {
//         const timeLeft = (expirationTime - now) / 1000

//         return message.reply(`пожалуйста, подождите еще ${timeLeft.toFixed(2)} секунд перед тем как использовать \`${commandHandler.name}\`!`)
//           .then(msg => msg.delete({timeout: timeLeft * 1000 + 1000}))
//       }
//     } else {
//       timestamps.set(message.author.id, now)
//       setTimeout(() => timestamps.delete(message.author.id), cooldownAmount)
//     }

//     if (await client.db.getAccessRoleEnabled(message.guild.id)) {
//       const djRole = await client.db.getAccessRole(message.guild.id)

//       if (!message.member.roles.cache.some(role => role.name === djRole))
//       return
//     }

//     if (commandHandler.premium)
//       if (!await client.db.checkPremium(message.guild.id))
//         return message.channel.send({ embed: generateErrorMessage("На этом сервере нет **Премиума**, поэтому команда не может быть выполнена. Подробнее: `-vdonate`.") })

//     if (commandHandler.adminOnly)
//       if (message.member.permissions.has("MANAGE_GUILD"))
//         return commandHandler.execute(message, args)
//       else return

//     commandHandler.execute(message, args)
//   }
// })