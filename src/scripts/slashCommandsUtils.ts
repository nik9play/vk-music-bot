import { glob } from 'glob'
import { CommandCustomInteraction } from '../interactions/commandInteractions.js'
import { REST, Routes } from 'discord.js'
import logger from '../logger.js'

const rest = new REST().setToken(process.env.DISCORD_TOKEN)

async function registerSlashCommands(
  global: boolean = false,
  dev: boolean = true,
  clientId: string,
  guildId?: string
) {
  const files = await glob(`**/dist/interactions/commands/*.js`)

  const commands = await Promise.all(
    files.map(async (file) => {
      const module = await import(`../../${file}`)
      const command: CommandCustomInteraction = module.interaction

      return command
    })
  )

  if (dev) {
    if (!guildId) throw new Error('No guildId')
    try {
      logger.info(`Started refreshing ${commands.length} application (/) commands (DEV MODE).`)

      const data = (await rest.put(Routes.applicationGuildCommands(clientId, guildId), {
        body: commands.map((command) => command.data.toJSON())
      })) as any

      logger.info(`Successfully reloaded ${data.length} application (/) commands (DEV MODE).`)
    } catch (error) {
      logger.error(error)
    }
  }

  if (global) {
    try {
      logger.info(`Started refreshing ${commands.length} application (/) commands.`)

      const data = (await rest.put(Routes.applicationCommands(clientId), {
        body: commands.filter((command) => !command.dev).map((command) => command.data.toJSON())
      })) as any

      logger.info(`Successfully reloaded ${data.length} application (/) commands.`)
    } catch (error) {
      logger.error(error)
    }
  }
}

if (process.argv[2] && process.argv[3]) {
  console.log(process.argv[2], process.argv[3])
  await registerSlashCommands(false, true, process.argv[2], process.argv[3])
  process.exit(0)
}

if (process.argv[2]) {
  await registerSlashCommands(true, false, process.argv[2])
  process.exit(0)
}

logger.error('Wrong arguments.')
process.exit(1)
