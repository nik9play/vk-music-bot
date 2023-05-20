import { VkMusicBotClient } from '../../client.js'
import { IPCMessage, IPCHandler } from '../ipcManager.js'

export const ipcHandler: IPCHandler = {
  op: 'destroyAll',
  async handle(_: IPCMessage, client: VkMusicBotClient) {
    for (const player of client.playerManager.values()) {
      player.safeDestroy()
    }
  }
}
