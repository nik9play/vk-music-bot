import { InteractionReplyOptions } from 'discord.js'
import { getConfig } from '../../db.js'
import { MenuButtonType } from '../../helpers/menuCommandHelper.js'
import generatePlayerStartMessage from '../../helpers/playerStartHelper.js'
import { generateQueueResponse } from '../../helpers/queueCommandHelper.js'
import CustomPlayer from '../../kazagumo/CustomPlayer.js'
import { ButtonCustomInteraction } from '../../slashCommandManager.js'

const menu: ButtonCustomInteraction = {
  name: 'menu',
  execute: async ({ interaction, respond, client, guild, customAction }) => {
    const player = client.kazagumo.getPlayer<CustomPlayer>(guild.id)
    const config = await getConfig(guild.id)
    // if (!player || !voice) {
    //   return
    // }

    let action: 'update' | 'delete' = 'delete'

    switch (customAction) {
      case MenuButtonType.Stop:
        player?.pause(false)
        player?.setLoop('none')
        player?.queue.clear()
        player?.skip()
        action = 'delete'
        break
      case MenuButtonType.Queue:
        await respond(generateQueueResponse(1, player) as InteractionReplyOptions)
        return
      case MenuButtonType.Skip:
        player?.pause(false)
        player?.skip()
        break
      case MenuButtonType.Repeat:
        if (player?.loop === 'none') {
          player?.setLoop('track')
        } else if (player?.loop === 'track') {
          player?.setLoop('queue')
        } else if (player?.loop === 'queue') {
          player?.setLoop('none')
        }
        action = 'update'
        break
      case MenuButtonType.Pause:
        player?.pause(!player?.paused)
        //if (!config.enable247) this.client.timers.set(guild.id, Utils.getExitTimeout(player, this.client))
        action = 'update'
        break
    }
    //await respond({ embeds: [Utils.generateErrorMessage(msg)], ephemeral: true })

    if (action === 'update') {
      if (player?.queue.current) {
        await interaction.update(generatePlayerStartMessage(player, player.queue.current))
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

export default menu
