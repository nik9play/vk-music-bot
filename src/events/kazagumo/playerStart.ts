import { KazagumoPlayer, KazagumoTrack } from 'kazagumo'
import { VkMusicBotClient } from '../../client.js'
import { getConfig } from '../../db.js'
import logger from '../../logger.js'
import generatePlayerStartMessage from '../../helpers/playerStartHelper.js'
import { DiscordAPIError } from 'discord.js'

export async function deletePreviousTrackStartMessage(client: VkMusicBotClient, player: KazagumoPlayer) {
  const previousMessage = client.latestMenus.get(player.guildId)

  if (previousMessage?.deletable) {
    await previousMessage
      .delete()
      .catch((err: DiscordAPIError) => {
        if (err.code === 10008) {
          logger.info('The previous message was not found.')
          return
        }
        logger.error({ err: err.message }, "Can't delete the previous message")
      })
      .finally(() => client.latestMenus.delete(player.guildId))
  }
}

export default async function playerStart(client: VkMusicBotClient, player: KazagumoPlayer, track: KazagumoTrack) {
  const config = await getConfig(player.guildId)

  if (config.announcements) {
    if (player.textId) {
      const channel = client.channels.cache.get(player.textId)

      if (!channel?.isTextBased()) return

      await deletePreviousTrackStartMessage(client, player)

      try {
        //clearTimeout(client.latestMenusTimeouts.get(player.guildId))

        const message = await channel.send(generatePlayerStartMessage(player, track))

        client.latestMenus.set(player.guildId, message)

        // client.latestMenusTimeouts.set(
        //   player.guildId,
        //   setTimeout(async () => {
        //     try {
        //       if (message.deletable) await message.delete()
        //     } catch (err) {
        //       logger.error({ err }, "Can't delete message")
        //     }
        //   }, track.length)
        // )
      } catch (err) {
        logger.error({ err }, "Can't send player start message")
      }
    }
  }
}
