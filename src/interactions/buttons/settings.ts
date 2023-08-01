import { getConfig, updateConfig } from '../../db.js'
import { generateSettingsShowResponse } from '../../helpers/settingsCommandHelper.js'
import BaseLoader from '../../loaders/baseLoader.js'
import { ButtonCustomInteraction } from '../buttonInteractions.js'

export const interaction: ButtonCustomInteraction = {
  name: 'settings',
  adminOnly: true,
  execute: async ({ customAction, client, guild, interaction }) => {
    const config = await getConfig(guild.id)

    switch (customAction) {
      case 'DJ':
        await updateConfig(guild.id, { djMode: !config.djMode })
        break
      case 'announcements':
        await updateConfig(guild.id, { announcements: !config.announcements })
        break
      case '247':
        if (config.premium) await updateConfig(guild.id, { enable247: !config.enable247 })
        break
      case 'loader':
        {
          const loaderIndex = client.loaderNames.findIndex((val) => val === config.defaultSource)
          const loaderCount = client.loaders.size

          let newIndex = loaderIndex + 1
          if (newIndex > loaderCount - 1) newIndex = 0

          const newLoader = client.loaders.at(newIndex) as BaseLoader

          await updateConfig(guild.id, { defaultSource: newLoader.name })
        }
        break
    }

    await interaction.update(await generateSettingsShowResponse(guild.id, client))
  }
}
