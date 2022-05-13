import VK, { APIResponse, ManyTracksResponse } from '../apis/VK'
import { MessageActionRow, MessageButton } from 'discord.js'
import logger from '../Logger'
import { Command } from '../SlashCommandManager'
import Utils from '../Utils'

export default new Command({
  name: 'search',
  djOnly: true,
  cooldown: 5,
  premium: false,
  adminOnly: false,
  deferred: true,
  execute: async function ({ guild, client, args, captcha, respond, meta }) {
    const search = args.join(' ')

    const query: any = {}

    if (captcha) {
      query.captcha_id = captcha.sid
      query.captcha_key = captcha.captcha_key
      query.captcha_index = captcha.index
    }

    const req = await VK.GetMany({
      q: search,

      ...query
    })

    if (req.status === 'error') {
      logger.warn({ req, ...meta }, 'VK Request error: %O')

      const reqError = req as APIResponse

      if (reqError.type === 'captcha') {
        client.captcha.set(guild.id, {
          type: 'search',
          args,
          url: reqError.error.captcha_img,
          sid: reqError.error.captcha_id,
          index: reqError.error.captcha_index
        })

        const captcha = client.captcha.get(guild.id)
        const embed = {
          description: 'Ошибка! Требуется капча. Введите команду `/captcha`, а после код с картинки.' +
            `Если картинки не видно, перейдите по [ссылке](${captcha?.url})`,
          color: 0x5181b8,
          image: {
            url: captcha?.url + Utils.generateRandomCaptchaString()
          }
        }

        return respond({ embeds: [embed], ephemeral: true })
      } else if (reqError.type === 'empty') {
        return respond({
          embeds: [Utils.generateErrorMessage('Не удалось ничего найти по запросу или плейлиста не существует.')],
          ephemeral: true
        })
      } else if (reqError.type === 'api') {
        return respond({ embeds: [Utils.generateErrorMessage('Неверный формат ссылки или запроса.')], ephemeral: true })
      } else if (reqError.type === 'request') {
        return respond({ embeds: [Utils.generateErrorMessage('Ошибка запроса к ВК.')], ephemeral: true })
      }
    }

    const reqTracks = req as ManyTracksResponse

    let description = ''

    const buttonRow = new MessageActionRow()
    buttonRow.addComponents(reqTracks.tracks.map((value, index) => {
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

    await respond({ embeds: [embed], components: [buttonRow] }, 30000)
  }
})