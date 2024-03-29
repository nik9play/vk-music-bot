import { Collection } from 'discord.js'
import { VkMusicBotClient } from '../client.js'
import { glob } from 'glob'
import { ShardClientUtil } from 'indomitable'
import logger from '../logger.js'

export interface IPCMessage<MessageData = any, ReplyData = any> {
  reply: (data: ReplyData) => void
  content: {
    op: string
    data: MessageData
  }
  repliable: boolean
}

export interface IPCHandler {
  op: string
  handle(msg: IPCMessage, client: VkMusicBotClient): Promise<void>
}

export class IPCManager {
  private events: Collection<string, IPCHandler> = new Collection()
  // private shardUtil: ShardClientUtil | null
  public client: VkMusicBotClient

  constructor(client: VkMusicBotClient) {
    this.client = client
  }

  async load() {
    const files = await glob(`**/dist/events/ipc/*.js`)

    for (const file of files) {
      const module = await import(`../../${file}`)
      const event: IPCHandler = module.ipcHandler

      this.events.set(event.op, event)
    }

    const shardUtil = this.client.shard as ShardClientUtil | null
    shardUtil?.on('message', (msg) => {
      logger.debug({ msg }, 'MESSAGE IPC')
      this.handle(msg as IPCMessage).catch((err) =>
        logger.error({ err }, 'Error handle ipc message')
      )
    })
  }

  private async handle(msg: IPCMessage) {
    const handler = this.events.get(msg.content.op)

    handler?.handle(msg, this.client)
  }
}
