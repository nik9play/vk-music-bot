import VK, { APIResponse, ManyTracksResponse } from '../apis/VK.js'
import { CommandExecuteParams } from '../interactions/commandInteractions.js'
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
      return respond(
        Utils.generateCaptchaMessage(
          guild.id,
          {
            type: 'search',
            query: queryParam,
            url: reqError.error.captcha_img,
            sid: reqError.error.captcha_id,
            index: reqError.error.captcha_index
          },
          client
        )
      )
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
        embeds: [
          Utils.generateErrorMessage(
            'Ошибка запроса к серверам бота. Обратитесь за поддержкой в [группу ВК](https://vk.com/vkmusicbotds) или [сервер Discord](https://discord.com/invite/3ts2znePu7).'
          )
        ],
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
            label: value.title.slice(0, 100),
            description: value.author.slice(0, 100),
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
