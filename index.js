import Discord from 'discord.js'
import { prefix } from './config.json'
import SDC from '@megavasiliy007/sdc-api'
import fs from 'fs'

const SDCClient = new SDC(process.env.SDC_TOKEN)
const client = new Discord.Client()

const queue = new Map()
const captchas = new Map()
const enable247List = new Set()

client.commands = new Discord.Collection()
const commandFiles = fs.readdirSync('./commands').filter(file => file.endsWith('.js'));

for (const file of commandFiles) {
  import(`./commands/${file}`).then(command => {
    client.commands.set(command.default.name, command.default)
  })
}

function serversStringByDigit(digits) {
  if (digits >= 10 && digits <= 20) {
    return "серверов"
  }

  switch(digits % 10) {
    case 1:
      return "сервер"
    case 2:
    case 3:
    case 4:
      return "сервера"
    default:
      return "серверов"
  }
}

client.once('ready', () => {
  console.log('Ready!')
  SDCClient.setAutoPost(client)
  const size = client.guilds.cache.size
  client.user.setPresence({activity: {name: `-vh | ${size} ${serversStringByDigit(size % 100)}`, type: 2}})
  setInterval(() => {
    const size = client.guilds.cache.size
    client.user.setPresence({activity: {name: `-vh | ${size} ${serversStringByDigit(size % 100)}`, type: 2}}) 
  }, 600000)
})

client.once('reconnecting', () => {
  console.log('Reconnecting...')
})

client.once('disconnect', () => {
  console.log('Disconnect.')
})

client.on('message', async message => {
  if (message.author.bot || !message.content.startsWith(prefix)) return

  let args = message.content.slice(prefix.length).split(/ +/)
  const command = args.shift().toLowerCase()

  if (command == "vh") {
    args = client.commands
  }

  let serverQueue = queue.get(message.guild.id)

  const options = {
    serverQueue,
    captchas,
    queue,
    enable247List,
    captcha: undefined
  }

  if (command == "vcaptcha") {
    sendCaptcha(message, args, options)
    return message.channel.stopTyping()
  }

  if (!client.commands.has(command)) return

  if (captchas.get(message.member.id)) {
    const captcha = captchas.get(message.member.id)
    message.reply(`Прежде чем выполнить данный запрос, вы должны ввести капчу! Введите \`-vcaptcha <текст_с_картинки>\`. ${captcha.url}`)
    return message.channel.stopTyping()
  }

  if (checkForVoiceLeave(message, serverQueue)) {
    serverQueue = queue.get(message.guild.id)
  }

  try {
    client.commands.get(command).execute(message, args, options)
  } catch (error) {
    console.error(error)
  } finally {
    message.channel.stopTyping()
  }
})

function sendCaptcha(message, args, options) {
  if (captchas.has(message.member.id)) {
    let captcha = captchas.get(message.member.id)
    captcha.key = args[0]
    options.captcha = captcha
    if (captcha.type == "vp") {
      client.commands.get("vp").execute(message, captcha.args, options)
    } else if (captcha.type == "addPlaylist") {
      client.commands.get("vpl").execute(message, captcha.args, options)
    } else if (captcha.type == "addUser") {
      client.commands.get("vu").execute(message, captcha.args, options)
    }
    captchas.delete(message.member.id)
  }
}

function checkForVoiceLeave(message, serverQueue) {
  if (serverQueue)
    if (serverQueue.connection)
      if (!serverQueue.connection.dispatcher && serverQueue.songs.length > 0) {
        serverQueue.songs = []
        queue.delete(message.guild.id)
        return true
      }
}

client.login(process.env.DISCORD_TOKEN)