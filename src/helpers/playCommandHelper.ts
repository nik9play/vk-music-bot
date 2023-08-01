import Utils, { ErrorMessageType } from '../utils.js'
import { EmbedBuilder } from 'discord.js'
import { getConfig } from '../db.js'
import BotPlayer from '../modules/botPlayer.js'
import { CommandExecuteParams } from '../interactions/commandInteractions.js'
import { CaptchaLoaderError, LoaderError } from '../loaders/baseLoader.js'

export async function playCommandHandler(
  params: Omit<CommandExecuteParams, 'interaction'>,
  queryParam: string,
  countParam?: number | null,
  offsetParam?: number | null,
  sourceParam?: string | null
) {
  const { guild, voice, text, client, captcha, respond, send } = params

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

  let loader = client.loaders.find((el) => el.checkQuery(queryParam))

  if (!loader) {
    loader = client.loaders.get(sourceParam ?? config.defaultSource)
  }

  if (!loader) {
    return
  }

  try {
    const [tracks, embed, wrongTracks] = await loader.resolveTracks(
      queryParam,
      countParam,
      offsetParam,
      captcha
    )

    const player = await client.playerManager.handle(guild, voice.id, text.id, node, tracks)
    if (player instanceof BotPlayer) {
      player.play()
    }

    await respond({ embeds: [embed] })

    if (wrongTracks.length > 0) {
      let desc = wrongTracks
        .slice(0, 5)
        .map((e) => {
          return Utils.escapeFormat(e)
        })
        .join('\n')

      desc = `${desc}\n${
        wrongTracks.length > 5
          ? `...\nи еще ${wrongTracks.length - 5} ${Utils.declOfNum(wrongTracks.length - 5, [
              'трек',
              'трека',
              'треков'
            ])}.`
          : ''
      }`

      await send(
        {
          embeds: [
            new EmbedBuilder()
              .setColor(loader.color)
              .setAuthor({
                name: 'Следующие треки не могут быть добавлены из-за решения автора или представителя, либо они длиннее 30 минут.'
              })
              .setDescription(desc)
          ]
        },
        30_000
      )
    }

    if (!config.premium) {
      if (player instanceof BotPlayer)
        if (player.queue.length > 200) {
          player.queue.length = 200
          await send({
            embeds: [
              Utils.generateErrorMessage(
                'В очереди было больше 200 треков, поэтому лишние треки были удалены. ' +
                  'Хотите больше треков? Приобретите Премиум, подробности: </donate:906533685979918396>.',
                ErrorMessageType.Warning
              )
            ]
          })
        }
    }
  } catch (err) {
    if (err instanceof CaptchaLoaderError) {
      const captchaResponse = await Utils.handleCaptchaError(
        {
          sid: err.captchaSid,
          url: err.captchaUrl,
          type: 'play',
          query: queryParam,
          index: err.captchaIndex,
          count: countParam,
          offset: offsetParam
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
