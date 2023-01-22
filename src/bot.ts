import { Options, GatewayIntentBits, Partials } from 'discord.js'
import { VkMusicBotClient } from './client.js'

import SlashCommandManager from './slashCommandManager.js'
import logger from './logger.js'
import { NodeOption } from 'shoukaku'
import { prisma, prismaConnect } from './db.js'

// const LavalinkServersString = process.env.LAVALINK_NODES

// if (LavalinkServersString == null) throw new Error('poshel ti')

// const nodes: NodeOption[] = LavalinkServersString.split(';').map((val): NodeOption => {
//   const arr = val.split(',')
//   return {
//     name: arr[0],
//     url: `${arr[1]}:${arr[2]}`,
//     auth: arr[3],
//     secure: false
//   }
// })

// const client = new VkMusicBotClient({
//   makeCache: Options.cacheWithLimits({
//     ...Options.DefaultMakeCacheSettings,
//     MessageManager: 50,
//     PresenceManager: 0,
//     ThreadManager: 20
//   }),
//   intents: [GatewayIntentBits.Guilds, GatewayIntentBits.GuildVoiceStates, GatewayIntentBits.GuildMessages]
// })

async function bot() {
  // await client.initDb()
  // await prismaConnect()
  // logger.info('DB initialized.')
  // const slashCommandManager = new SlashCommandManager(client)
  // await slashCommandManager.init()
  // logger.info(`Loaded ${client.commands.size} commands.`)
  // await client.login(process.env.DISCORD_TOKEN)
}

bot()
