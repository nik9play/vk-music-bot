import { Connectors, NodeOption, Shoukaku, ShoukakuOptions } from 'shoukaku'
import { VkMusicBotClient } from '../client.js'
import logger from '../logger.js'

const LavalinkServersString = process.env.LAVALINK_NODES

if (LavalinkServersString == null) throw new Error('Node env is null.')

const nodes: NodeOption[] = LavalinkServersString.split(';').map((val): NodeOption => {
  const arr = val.split(',')
  return {
    name: arr[0],
    url: `${arr[1]}:${arr[2]}`,
    auth: arr[3],
    secure: false
  }
})

const options: ShoukakuOptions = {
  reconnectTries: 1,
  reconnectInterval: 10,
  restTimeout: 60,
  moveOnDisconnect: false,
  resume: false,
  resumeKey: `kazagumo_cluster_asdf`,
  resumeTimeout: 30,
  resumeByLibrary: false
}

export default class ShoukakuManager extends Shoukaku {
  constructor(client: VkMusicBotClient) {
    super(new Connectors.DiscordJS(client), nodes, options)
    this.on('ready', (name, reconnected) =>
      logger.info(
        `Shoukaku Lavalink Node: ${name} is now connected, This connection is ${
          reconnected ? 'resumed' : 'a new connection'
        }`
      )
    )
    this.on('error', (_, error) => logger.error(error, 'Shoukaku Error'))
    this.on('close', (name, code, reason) =>
      logger.info(`Shoukaku Lavalink Node: ${name} closed with code: ${code} reason: ${reason || 'No reason'}`)
    )
    this.on('disconnect', (name, _, moved) =>
      logger.info(
        `Shoukaku Lavalink Node: ${name} disconnected | ${
          moved ? 'Players have been moved' : 'Players have been disconnected'
        }`
      )
    )
    this.on('debug', (name, info) => {
      if (info.toLowerCase().includes('server load')) return
      logger.debug(`Shoukaku Lavalink Node: ${name} ${info}`)
    })
  }
}
