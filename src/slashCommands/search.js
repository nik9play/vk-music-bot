import VK from '../apis/VK'
import generateErrorMessage from '../tools/generateErrorMessage'
import { MessageActionRow, MessageButton } from 'discord.js'

export default {
  name: 'search',
  djOnly: true,
  cooldown: 5,
  execute: async function ({ guild, client, args, captcha, respond }) {
    const search = args.join(' ')

    const query = {}
    
    if (captcha) {
      query.captcha_id = captcha.sid
      query.captcha_key = captcha.captcha_key,
      query.captcha_index = captcha.index
    }

    const req = await VK.GetMany({
      q: search,

      ...query
    })

    if (req.status === 'error') {
      console.log('error:   ', req)
      if (req.type === 'captcha') {
        client.captcha.set(guild.id, {
          type: 'search',
          args,
          url: req.error.captcha_img,
          sid: req.error.captcha_id,
          index: req.error.captcha_index
        })

        const captcha = client.captcha.get(guild.id)
        const embed = {
          description: 'Ошибка! Требуется капча. Введите команду `/captcha`, а после код с картинки.',
          color: 0x5181b8,
          image: {
            url: captcha.url
          }
        }

        return respond({ embeds: [embed], ephemeral: true })
      } else if (req.type === 'empty') {
        return respond({ embeds: [generateErrorMessage('Не удалось ничего найти по запросу или плейлиста не существует.')], ephemeral: true })
      } else if (req.type === 'api') {
        return respond({ embeds: [generateErrorMessage('Неверный формат ссылки или запроса.')], ephemeral: true })
      } else if (req.type === 'request') {
        return respond({ embeds: [generateErrorMessage('Ошибка запроса к ВК.')], ephemeral: true })
      }
    }

    let description = ''

    const buttonRow = new MessageActionRow()
    buttonRow.addComponents(req.tracks.map((value, index) => {
      description += `${index + 1}. ${value.author} — ${value.title}\n`
      return new MessageButton()
        .setLabel((index + 1).toString())
        .setCustomId('search,' + value.id)
        .setStyle('PRIMARY')
    }))

    description += '\n**Чтобы выбрать трек, нажмите на его номер**'

    const embed = {
      color: 0x5181b8,
      title: 'Результаты поиска',
      description
    }

    respond({ embeds: [embed], components: [buttonRow] }, 30000)
  }
}