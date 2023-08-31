import { InteractionReplyOptions, PermissionsBitField } from 'discord.js'
import { getConfig } from '../../db.js'
import {
  generatePlayerStartMessage,
  MenuButtonIds,
  menuButtonNames
} from '../../helpers/playerStartHelper.js'
import { generateQueueResponse } from '../../helpers/queueCommandHelper.js'
import Utils from '../../utils.js'
import { ButtonCustomInteraction } from '../buttonInteractions.js'

export const interaction: ButtonCustomInteraction = {
  name: 'menu',
  djOnly: true,
  execute: async ({ interaction, respond, client, guild, customAction, voice }) => {
    const player = client.playerManager.get(guild.id)

    if (!player || !Utils.checkPlayer(respond, player)) {
      if (interaction.message.deletable) await interaction.message.delete().catch(() => {})
      return
    }

    if (
      !Utils.checkPlaying(respond, player.current) ||
      !Utils.checkNodeState(respond, player) ||
      !Utils.checkSameVoiceChannel(respond, voice)
    ) {
      return
    }

    if (!voice) {
      await Utils.sendNoVoiceChannelMessage(respond)
      return
    }

    const config = await getConfig(guild.id)

    if (config.djMode) {
      const djRole = config.djRoleName

      if (
        !interaction.member.permissions.has(PermissionsBitField.Flags.ManageGuild) &&
        !interaction.member.roles.cache.some((role) => role.name === djRole)
      ) {
        await respond({
          embeds: [
            Utils.generateErrorMessage(
              `Сейчас включен DJ режим, и вы не можете использовать кнопки, так как у вас нет роли \`${djRole}\`.`
            )
          ],
          ephemeral: true
        })
        return
      }
    }

    let action: 'update' | 'delete' = 'delete'

    switch (customAction) {
      case MenuButtonIds.Stop:
        await player.stop()
        break
      case MenuButtonIds.Queue:
        await respond(generateQueueResponse(1, player) as InteractionReplyOptions)
        return
      case MenuButtonIds.Skip:
        await player.skip()
        break
      case MenuButtonIds.Repeat:
        if (player.repeat === 'none') {
          player.repeat = 'track'
        } else if (player.repeat === 'track') {
          player.repeat = 'queue'
        } else if (player.repeat === 'queue') {
          player.repeat = 'none'
        }
        action = 'update'
        break
      case MenuButtonIds.Pause:
        if (player.player.paused) {
          Utils.clearExitTimeout(guild.id, client)

          await player.player.setPaused(false)
        } else {
          await player.player.setPaused(true)

          if (player && !(await getConfig(player?.guildId)).enable247)
            Utils.setExitTimeout(player, client)
        }

        action = 'update'
        break
      case MenuButtonIds.Leave:
        await player.safeDestroy()
        break
    }

    client.userActionsManager.addAction(guild.id, {
      type: 'button',
      memberId: interaction.member.id,
      name: `Меню, ${menuButtonNames[customAction as MenuButtonIds]}`
    })

    //await respond({ embeds: [Utils.generateErrorMessage(msg)], ephemeral: true })

    if (action === 'update') {
      if (player.current) {
        await interaction.update(await generatePlayerStartMessage(player, player.current))
        return
      }

      action = 'delete'
    }

    if (action === 'delete') {
      // if (!player || player.queue.size === 0) {
      //   if (interaction.message.deletable)
      //     await interaction.message.delete().catch((err) => logger.error({ err }, "Can't delete message"))
      //   this.client.latestMenus.delete(guild.id)
      // }
    }
  }
}
