import Discord from 'discord.js'
import { prefix } from './config.json'
import { Duration } from 'luxon'
import gachiList from './gachi.json'
import SDC from '@megavasiliy007/sdc-api'

// стата для bots.discord-servers.com
const SDCClient = new SDC(process.env.SDC_TOKEN)

// Commands
import execute from './commands/vp'
import skip from './commands/vn'
import stop from './commands/vs'
import addPlaylist from './commands/vpl'
import shuffle from './commands/vsh'
import pause from './commands/vps'
import addUser from './commands/vu'

const client = new Discord.Client()
const queue = new Map()

const captchas = new Map()

function serversStringByDigit(digit) {
  switch(digit) {
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
  client.user.setPresence({activity: {name: `-vh | ${size} ${serversStringByDigit(size % 10)}`, type: 2}})
  setInterval(() => {
    const size = client.guilds.cache.size
    client.user.setPresence({activity: {name: `-vh | ${size} ${serversStringByDigit(size % 10)}`, type: 2}}) 
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

  const args = message.content.slice(prefix.length).split(/ +/)
	const command = args.shift().toLowerCase()

  let serverQueue = queue.get(message.guild.id)

  if (command == "vcaptcha") {
    sendCaptcha(message, serverQueue, args[0])
    return
  }

  if (captchas.get(message.member.id)) {
    const captcha = captchas.get(message.member.id)
    message.reply(`Прежде чем выполнить данный запрос, вы должны ввести капчу! Введите \`-vcaptcha <текст_с_картинки>\`. ${captcha.url}`)
    return
  }

  if (checkForVoiceLeave(message, serverQueue)) {
    serverQueue = queue.get(message.guild.id)
  }

  if (command == "vp") {
    execute(message, serverQueue, args, null, captchas, queue)
    return
  } else if (command == "vn") {
    skip(message, serverQueue)
    return
  } else if (command == "vs") {
    stop(message, serverQueue)
    return
  } else if (command == "vps") {
    pause(message, serverQueue, queue)
    return
  } else if (command == "vpl") {
    addPlaylist(message, serverQueue, args, null, captchas, queue)
    return 
  } else if (command == "vsh") {
    shuffle(message, serverQueue)
    return
  } else if (command == "vh") {
    help(message)
    return
  } else if (command == "vu") {
    addUser(message, serverQueue, args, null, captchas, queue)
  } else if (command == "vdsc") {
    serverCount(message)
    return
  } else if (command == "vgachi") {
    gachi(message, serverQueue)
    return 
  } else if (command == "vq") {
    if (!serverQueue) return message.reply('очередь пуста.')

    if (isNaN(args[0]) && args[0]) return message.reply("неверный `offset`")
    const songs = serverQueue.songs
    let offset = args[0] ? (args[0] * 10) - 10 + 1 : 1
    let count = offset + 9
    
    if (songs.length - (offset - 1) < 10) count = offset + songs.length - (offset - 1) - 1

    if (offset > count) return message.reply("больше ничего нет.")
    
    let list = ""
    let current = `Сейчас играет: **${songs[0].artist} — ${songs[0].title}**`

    for (let i = offset - 1; i <= count - 1; i++) {
      const e = songs[i]
      list += `${i + 1}. ${e.artist} — ${e.title}\n`
    }

    if (count < songs.length) list += `\nЧтобы просмотреть список дальше, введите \`-vq ${parseInt(args[0] ?? 1) + 1}\``

    const embed = {
      color: 0x5181b8,
      title: "**Музыка в очереди:**",
      description: list,
      fields: [
        {
          name: current,
          value: `${serverQueue.connection.dispatcher.paused ? ":pause_button:" : ":arrow_forward:"} ${Duration.fromMillis(serverQueue.connection.dispatcher.streamTime).toFormat("mm:ss")}`
        },
      ]
    }

    message.channel.send({embed: embed})
  }
})

function sendCaptcha(message, serverQueue, key) {
  if (captchas.get(message.member.id)) {
    let captcha = captchas.get(message.member.id)
    captcha.key = key
    if (captcha.type == "execute") {
      execute(message, serverQueue, captcha.args, captcha, captchas, queue)
    } else if (captcha.type == "addPlaylist") {
      addPlaylist(message, serverQueue, captcha.args, captcha, captchas, queue)
    } else if (captcha.type == "addUser") {
      addUser(message, serverQueue, captcha.args, captcha, captchas, queue)
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

function gachi(message, serverQueue) {
  const id = gachiList[Math.floor(Math.random() * gachiList.length)]
  execute(message, serverQueue, [id], null, captchas, queue)
  message.reply(`:male_sign:DUNGEON MASTER:male_sign: сделал выбор!`)
}

function help(message) {
  const embed = {
    color: 0x5181b8,
    title: "**Команды:**",
    author: {
      name: "megaworld",
      url: "https://megaworld.space",
      icon_url: "https://megaworld.space/favicon-32x32.png"
    },
    description: `\`-vp\` — включить музыку по названию или по ID.
\`-vs\` — выключить музыку и очистить очередь.
\`-vps\` — пауза и воспроизведение.
\`-vsh\` — перемешать очередь
\`-vn\` — пропустить музыку.
\`-vu\` — добавить музыку пользователя в очередь. Принимает 3 аргумента:
\`-vpl\` — добавить музыку в очередь из плейлиста. Принимает те же 3 аргумента:
\`-vpl <id>(обяз.) <count> <offset>\`. 
=> \`id\` – ID плейлиста (или пользователя) из ссылки. Например __**44655282_7**__ из *vk.com/audiosXXXXXXXXXX?section=playlists&z=audio_playlist__**44655282_7**__*.
=> \`count\` – количество треков.
=> \`offset\` – отступ. Например, отступ **1** добавит треки с **1 до 10**, а отсуп **2** добавит треки с **11 до 20**.
\`-vq\` — просмотр очереди.
\`-vgachi\` — включить трек на выбор :male_sign:DUNGEON MASTER:male_sign:`
  }

  message.channel.send({embed: embed})
}

function serverCount(message) {
  message.reply(client.guilds.cache.size)
}

client.login(process.env.DISCORD_TOKEN)