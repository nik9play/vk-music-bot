import { getConfig } from '../db.js'
import { CommandExecuteParams } from '../interactions/commandInteractions.js'
import { CaptchaLoaderError, LoaderError } from '../loaders/baseLoader.js'

import BotPlayer from '../modules/botPlayer.js'
import Utils, { ErrorMessageType } from '../utils.js'
import { ActionRowBuilder, EmbedBuilder, StringSelectMenuBuilder } from 'discord.js'

export async function searchCommandHandler(
  params: Omit<CommandExecuteParams, 'interaction'>,
  queryParam: string,
  sourceParam?: string | null
) {
  const { guild, voice, text, client, captcha, respond } = params

  if (!Utils.checkSameVoiceChannel(respond, voice)) return
  if (!Utils.checkVoicePermissions(respond, voice)) return

  const node = client.shoukaku.getNode('auto')

  if (!node) {
    await respond({
      embeds: [
        Utils.generateErrorMessage(
          'Нет доступных серверов для воспроизведения. Попробуйте ещё раз через несколько минут. Если не сработает, обратитесь за ' +
            'поддержкой в [группу ВК](https://vk.com/vkmusicbotds) или [сервер Discord](https://discord.com/invite/3ts2znePu7).'
        )
      ],
      ephemeral: true
    })
    return
  }

  Utils.clearExitTimeout(guild.id, client)

  const config = await getConfig(guild.id)

  const loader = client.loaders.get(sourceParam ?? config.defaultSource)

  if (!loader) return

  try {
    const tracks = await loader.resolveSearchResults(queryParam, 10, captcha)

    const player = await client.playerManager.handle(guild, voice.id, text.id, node, tracks)
    if (player instanceof BotPlayer) {
      player.play()
    }

    const selectMenu = new ActionRowBuilder<StringSelectMenuBuilder>().addComponents(
      new StringSelectMenuBuilder()
        .setCustomId('search')
        .setPlaceholder('Выберите трек')
        .addOptions(
          tracks
            .filter((value) => !!value.uri)
            .map((value) => {
              return {
                label: value.title.slice(0, 100),
                description: value.author.slice(0, 100),
                value: 'search,' + value.uri
              }
            })
        )
    )

    const embed = new EmbedBuilder()
      .setColor(loader.color)
      .setTitle('Найдены треки')
      .setFooter({ iconURL: loader.iconURL, text: loader.displayName })

    await respond({ embeds: [embed], components: [selectMenu] }, 30_000)
  } catch (err) {
    if (err instanceof CaptchaLoaderError) {
      const captchaResponse = await Utils.handleCaptchaError(
        {
          sid: err.captchaSid,
          url: err.captchaUrl,
          type: 'search',
          query: queryParam,
          index: err.captchaIndex
        },
        params,
        !captcha
      )
      if (captchaResponse) await respond(captchaResponse)

      return
    }

    if (err instanceof LoaderError) {
      await respond({ embeds: [Utils.generateErrorMessage(err.message, ErrorMessageType.Error)] })
      return
    }
    throw err
  }
}
