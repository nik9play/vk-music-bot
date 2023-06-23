import Utils, { ErrorMessageType } from '../utils.js'
import { EmbedBuilder } from 'discord.js'
import { getConfig } from '../db.js'
import BotPlayer from '../modules/botPlayer.js'
import { CommandExecuteParams } from '../interactions/commandInteractions.js'

// async function fillQueue(
//   trackResponses: OneTrackResponse[],
//   client: VkMusicBotClient,
//   guild: Guild,
//   voiceChannelId: string,
//   textChannelId: string,
//   node: Node,
//   wrongTracks: OneTrackResponse[]
// ) {
//   const tracks: BotTrack[] = trackResponses
//     .filter((e) => {
//       if (!e.url || e.duration > 1800) {
//         wrongTracks.push(e)
//         return false
//       } else {
//         return true
//       }
//     })
//     .map((e) => {
//       const unresolvedTrack = new BotTrack(undefined, e.url, {
//         author: e.author,
//         title: e.title,
//         thumb: e.thumb,
//         duration: e.duration,
//         id: e.id,
//         owner_id: e.id,
//         access_key: e.access_key
//       })

//       return unresolvedTrack
//     })

//   const result = await client.playerManager.handle(guild, voiceChannelId, textChannelId, node, tracks)
//   if (result instanceof BotPlayer) {
//     result.play()
//   }
//   return result
// }

export async function playCommandHandler(
  params: CommandExecuteParams,
  queryParam: string,
  countParam?: number | null,
  offsetParam?: number | null,
  sourceParam?: string | null
) {
  const { guild, voice, text, client, captcha, respond, send } = params

  if (!voice) {
    respond({
      embeds: [Utils.generateErrorMessage('Необходимо находиться в голосовом канале.')],
      ephemeral: true
    })
    return
  }
  if (!guild.members.me) return

  if (!Utils.checkVoicePermissions(voice)) {
    respond({
      embeds: [Utils.generateErrorMessage('Мне нужны права, чтобы войти в канал.')],
      ephemeral: true
    })
    return
  }

  const node = client.shoukaku.getNode('auto')

  if (!node) {
    respond({
      embeds: [
        Utils.generateErrorMessage(
          'Нет доступных серверов для воспроизведения. Попробуйте еще раз через несколько минут, если не сработает, обратитесь за ' +
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

  const [tracks, embed, wrongTracks] = await loader.resolveTracks(queryParam, countParam, offsetParam, captcha)

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
}
