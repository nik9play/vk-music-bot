import Discord from 'discord.js'
import { prefix } from './config.json'
import { audioSearchOne, audioGetPlaylist } from './vkapi.js'
import { Duration } from 'luxon'

const client = new Discord.Client()
const queue = new Map()

client.once('ready', () => {
  console.log('Ready!')
  client.user.setPresence({activity: {name: "-vh", type: 2}})
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

  const serverQueue = queue.get(message.guild.id)

  if (command == "vp") {
    execute(message, serverQueue, args)
    return
  } else if (command == "vn") {
    skip(message, serverQueue)
    return
  } else if (command == "vs") {
    stop(message, serverQueue)
    return
  } else if (command == "vps") {
    pause(message, serverQueue)
    return
  } else if (command == "vpl") {
    addPlaylist(message, serverQueue, args)
    return 
  } else if (command == "vsh") {
    shuffle(message, serverQueue)
    return
  } else if (command == "vh") {
    help(message)
    return
  } else if (command == "vq") {
    if (!serverQueue) return message.reply('очередь пуста.')

    let list = ""
    let current = `Сейчас играет: `

    serverQueue.songs.forEach((e, i) => { 
      if (i == 0) current += `**${e.artist} — ${e.title}**`

      list += `${i + 1}. ${e.artist} — ${e.title}\n`
    })

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

function getQueueContructTemplate(message, voiceChannel) {
  return {
    textChannel: message.channel,
    voiceChannel: voiceChannel,
    connection: null,
    songs: [],
    volume: 5,
    playing: true,
  }
}

async function execute(message, serverQueue, args) {
  const voiceChannel = message.member.voice.channel
  if (!voiceChannel) return message.reply('вы должны быть в голосовом канале чтобы включить музыку.')

  const permissions = voiceChannel.permissionsFor(message.client.user)
  if (!permissions.has('CONNECT') || !permissions.has('SPEAK')) {
    return message.reply('мне нужны права чтобы играть музыку!')
  }

  const query = args.join(" ").trim()
  if (query.length < 3) return message.reply("слишком короткий запрос.")
  const songInfo = await audioSearchOne(query)
  if (songInfo.status == "error") {
    if (songInfo.message == "empty-api") return message.reply("не могу найти трек.")
    return message.reply("ошибка. ¯\\_(ツ)_/¯")
  }

  const song = songInfo.songInfo

  const songEmbed = {
    color: 0x5181b8,
    title: song.title,
    author: {
      name: "Трек добавлен!"
    },
    description: song.artist,
    fields: [
      {
        name: 'Длительность',
        value: Duration.fromObject({seconds: song.duration}).toFormat("mm:ss")
      },
    ]
  }

  if (!serverQueue) {
    const queueContruct = getQueueContructTemplate(message, voiceChannel)

    queue.set(message.guild.id, queueContruct)

    queueContruct.songs.push(song)
    message.channel.send({embed: songEmbed})

    try {
      var connection = await voiceChannel.join()
      queueContruct.connection = connection
      play(message.guild, queueContruct.songs[0])
    } catch (err) {
      console.log(err)
      queue.delete(message.guild.id)
      return message.channel.send(err)
    }
  } else {
    serverQueue.songs.push(song)
    console.log(serverQueue.songs)
    return message.channel.send({embed: songEmbed})
  }

}

async function addPlaylist(message, serverQueue, args) {
  const voiceChannel = message.member.voice.channel
  if (!voiceChannel) return message.reply('вы должны быть в голосовом канале чтобы включить музыку.')

  if (serverQueue) if (serverQueue.connection.dispatcher.paused) return serverQueue.connection.dispatcher.resume()

  const permissions = voiceChannel.permissionsFor(message.client.user)
  if (!permissions.has('CONNECT') || !permissions.has('SPEAK')) {
    return message.reply('мне нужны права чтобы играть музыку!')
  }

  const id = args[0]
  if (!id || !id.includes("_")) return message.reply("неверный ID")
  const count = args[1] ?? 10
  const offset = args[2] ?? 1
  if (count > 100) return message.reply("слишком большой `count`.")
  if (id.length < 3) return message.reply("слишком короткий запрос.")
  const res = await audioGetPlaylist(id.split("_")[0], id.split("_")[1], count, offset)
  let newArray = res.newArray
  if (res.status == "error") {
    if (res.message == "empty-api") return message.reply("не могу найти плейлист.")
    return message.reply("ошибка. ¯\\_(ツ)_/¯")
  }

  const playlistEmbed = {
    color: 0x5181b8,
    title: `Добавлено треков: **${count}**.`,
    author: {
      name: "Плейлист добавлен!"
    }
  }

  if (!serverQueue) {
    const queueContruct = getQueueContructTemplate(message, voiceChannel)

    queue.set(message.guild.id, queueContruct)

    queueContruct.songs = queueContruct.songs.concat(newArray)

    try {
      var connection = await voiceChannel.join()
      queueContruct.connection = connection
      play(message.guild, queueContruct.songs[0])
      return message.channel.send({embed: playlistEmbed})
    } catch (err) {
      console.log(err)
      queue.delete(message.guild.id)
      return message.channel.send(err)
    }
  } else {
    serverQueue.songs = serverQueue.songs.concat(newArray)

    return message.channel.send({embed: playlistEmbed})
  }
}

function shuffle(message, serverQueue) {
  if (!serverQueue) return message.reply('нечего перемешивать.')
  if (serverQueue.songs.length < 3) return message.reply('слишком маленькая очередь.')
  function shuffleArray(array) {
    let arrayCopy = array
    let currentIndex = arrayCopy.length
    let temporaryValue, randomIndex
    while (0 !== currentIndex) {
      randomIndex = Math.floor(Math.random() * currentIndex);
      currentIndex -= 1;
  
      temporaryValue = arrayCopy[currentIndex]
      arrayCopy[currentIndex] = arrayCopy[randomIndex]
      arrayCopy[randomIndex] = temporaryValue
    }
    return arrayCopy
  }

  const newArray = shuffleArray(serverQueue.songs)

  serverQueue.songs = newArray
  play(message.guild, serverQueue.songs[0])
  message.reply("перемешано.")
}

function help(message) {
  message.reply(`**Команды:**

  \`-vp\` — включить музыку по названию или по ID.
  \`-vs\` — выключить музыку и очистить очередь.
  \`-vps\` — пауза и воспроизведение.
  \`-vsh\` — перемешать очередь
  \`-vn\` — пропустить музыку.
  \`-vpl\` — добавить музыку в очередь из плейлиста. Принимает 3 аргумента:
  \`-vpl <id>(обяз.) <count> <offset>\`. 
    \`id\` – ID плейлиста из ссылки. Например __**44655282_7**__ из *vk.com/audiosXXXXXXXXXX?section=playlists&z=audio_playlist__**44655282_7**__*.
    \`count\` – количество треков.
    \`offset\` – отступ. Например, отступ **1** добавит треки с **1 до 10**, а отсуп **2** добавит треки с **11 до 20**.
  \`-vq\` — просмотр очереди.
  
  > https://megaworld.space`)
}

function skip(message, serverQueue) {
  const voiceChannel = message.member.voice.channel
  if (!voiceChannel) return message.reply('вы должны быть в голосовом канале чтобы пропустить музыку.')
  if (!serverQueue) return message.reply('некуда пропускать.')
  serverQueue.connection.dispatcher.end()
}

function stop(message, serverQueue) {
  const voiceChannel = message.member.voice.channel
  if (!voiceChannel) return message.reply('вы должны быть в голосовом канале чтобы остановить музыку.')
  serverQueue.songs = []
  serverQueue.connection.dispatcher.end()
}

function pause(message, serverQueue) {
  const voiceChannel = message.member.voice.channel
  if (!voiceChannel) return message.reply('вы должны быть в голосовом канале чтобы поставить музыку на паузу.')
  if (!serverQueue) return
  if (!serverQueue.connection.dispatcher.paused) serverQueue.connection.dispatcher.pause() 
  else serverQueue.connection.dispatcher.resume()
}

function play(guild, song) {
  const serverQueue = queue.get(guild.id)

  if (!song) {
    serverQueue.voiceChannel.leave()
    queue.delete(guild.id)
    return
  }

  const dispatcher = serverQueue.connection.play(song.url)
    .on('finish', () => {
      console.log('Music ended!')
      serverQueue.songs.shift()
      play(guild, serverQueue.songs[0])
    })
    .on('error', error => {
      console.error(error)
    })
  dispatcher.setVolumeLogarithmic(serverQueue.volume / 5)
}

client.login("NzIxNzcyMjc0ODMwNTQwODMz.XuafdA.C726QZPJblBG2tW2u0LsfAKP4xk")