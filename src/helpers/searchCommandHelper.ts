import { CommandExecuteParams } from '../slashCommandManager.js'
import VK, { APIResponse, ManyTracksResponse } from '../apis/VK.js'
import logger from '../logger.js'
import Utils from '../utils.js'
import { ActionRowBuilder, StringSelectMenuBuilder } from 'discord.js'

export async function searchCommandHandler(params: CommandExecuteParams, queryParam: string) {
  const { guild, client, captcha, respond, meta } = params

  const query: any = {}

  if (captcha) {
    query.captcha_id = captcha.sid
    query.captcha_key = captcha.captcha_key
    query.captcha_index = captcha.index
  }

  const req = await VK.getMany({
    q: queryParam,
    count: 10,

    ...query
  })

  if (req.status === 'error') {
    logger.warn({ req, ...meta }, 'VK Request error')

    const reqError = req as APIResponse

    // todo: переделать работу с капчей
    if (reqError.type === 'captcha') {
      client.captcha.set(guild.id, {
        type: 'search',
        query: queryParam,
        url: reqError.error.captcha_img,
        sid: reqError.error.captcha_id,
        index: reqError.error.captcha_index
      })

      const captcha = client.captcha.get(guild.id)
      const embed = {
        description:
          'Ошибка! Требуется капча. Введите команду /captcha, а после код с картинки. ' +
          `Если картинки не видно, перейдите по [ссылке](${captcha?.url})  (только один раз).`,
        color: 0x5181b8,
        image: {
          url: captcha?.url + Utils.generateRandomCaptchaString()
        }
      }

      return respond({ embeds: [embed], ephemeral: true })
    } else if (reqError.type === 'empty') {
      return respond({
        embeds: [Utils.generateErrorMessage('Не удалось ничего найти по запросу.')],
        ephemeral: true
      })
    } else if (reqError.type === 'api') {
      return respond({
        embeds: [Utils.generateErrorMessage('Неверный формат ссылки или запроса.')],
        ephemeral: true
      })
    } else if (reqError.type === 'request') {
      return respond({
        embeds: [Utils.generateErrorMessage('Ошибка отправки запроса на стороне бота. Свяжитесь с поддержкой.')],
        ephemeral: true
      })
    }
  }

  const reqTracks = req as ManyTracksResponse

  const selectMenu = new ActionRowBuilder<StringSelectMenuBuilder>().addComponents(
    new StringSelectMenuBuilder()
      .setCustomId('search')
      .setPlaceholder('Выберите трек')
      .addOptions(
        reqTracks.tracks.map((value) => {
          return {
            label: value.title,
            description: value.author,
            value: 'search,' + value.id
          }
        })
      )
  )

  const embed = {
    color: 0x5181b8,
    title: 'Найдены треки'
  }

  await respond({ embeds: [embed], components: [selectMenu] }, 30000)
}
