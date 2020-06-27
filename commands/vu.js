import getQueueContructTemplate from '../tools/getQueueConstructTemplate'
import { audioGetUser } from '../vkapi'
import play from './play'

export default async function addUserAudio(message, serverQueue, args, captcha, captchas, queue) {
  const voiceChannel = message.member.voice.channel
  if (!voiceChannel) return message.reply('вы должны быть в голосовом канале чтобы включить музыку.')

  if (serverQueue) if (serverQueue.connection.dispatcher.paused) return serverQueue.connection.dispatcher.resume()

  const permissions = voiceChannel.permissionsFor(message.client.user)
  if (!permissions.has('CONNECT') || !permissions.has('SPEAK')) {
    return message.reply('мне нужны права чтобы играть музыку!')
  }

  const id = args[0]
  if (!id) return message.reply("неверный ID")
  const count = args[1] ?? 10
  const offset = args[2] ?? 1
  if (count > 100) return message.reply("слишком большой `count`.")
  if (id.length < 3) return message.reply("слишком короткий запрос.")
  const res = await audioGetUser(id, count, offset, captcha)
  let newArray = res.newArray
  if (res.status == "error") {
    if (res.message == "empty-api") return message.reply("не могу найти аудио у этого пользователя.")

    if (res.details.error_code == 14) {
      captchas.set(message.member.id, {
        type: "addUser",
        args: args,
        url: res.details.captcha_img,
        sid: res.details.captcha_sid
      })
      const captcha = captchas.get(message.member.id)
      return message.reply(`Прежде чем выполнить данный запрос, вы должны ввести капчу! Введите \`-vcaptcha <текст_с_картинки>\`. ${captcha.url}`)
    }

    return message.reply("ошибка. ¯\\_(ツ)_/¯")
  }

  const playlistEmbed = {
    color: 0x5181b8,
    title: `Добавлено треков: **${count}**.`,
    author: {
      name: "Музыка пользователя добавлена!"
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