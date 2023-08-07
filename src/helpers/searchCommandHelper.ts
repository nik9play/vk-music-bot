import { getConfig } from '../db.js'
import { CommandExecuteParams } from '../interactions/commandInteractions.js'
import { CaptchaLoaderError, LoaderError } from '../loaders/baseLoader.js'
import Utils, { ErrorMessageType } from '../utils.js'
import { ActionRowBuilder, EmbedBuilder, StringSelectMenuBuilder } from 'discord.js'

export async function searchCommandHandler(
  params: Omit<CommandExecuteParams, 'interaction'>,
  queryParam: string,
  sourceParam?: string | null
) {
  const { guild, voice, client, captcha, respond } = params

  if (!Utils.checkSameVoiceChannel(respond, voice)) return
  if (!Utils.checkVoicePermissions(respond, voice)) return

  Utils.clearExitTimeout(guild.id, client)

  const config = await getConfig(guild.id)

  const loader = client.loaders.get(sourceParam ?? config.defaultSource)

  if (!loader) return

  try {
    const tracks = await loader.resolveSearchResults(queryParam, 10, captcha)

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
