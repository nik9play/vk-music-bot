import { VkMusicBotClient } from '../../client.js'
import { IPCMessage, IPCHandler } from '../ipcManager.js'

export const ipcHandler: IPCHandler = {
  op: 'clientId',
  async handle(msg: IPCMessage<unknown, string | undefined>, client: VkMusicBotClient) {
    msg.reply(client.user?.id)
  }
}
