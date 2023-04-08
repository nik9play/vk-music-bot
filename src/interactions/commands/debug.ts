import BotPlayer from '../../modules/botPlayer.js'
import BotTrack from '../../structures/botTrack.js'
import { CommandCustomInteraction } from '../commandInteractions.js'

export const interaction: CommandCustomInteraction = {
  name: 'debug',
  adminOnly: false,
  premium: false,
  djOnly: false,
  execute: async function ({ guild, client, respond, voice, text }) {
    const node = client.shoukaku.getNode('auto')

    if (!node || !voice || !text) return

    const track = new BotTrack(
      undefined,
      'https://cs9-8v4.vkuseraudio.net/s/v1/ac/-rxYYJmMk13wpwbXLlbv5ftyl8jNtS8ifWaGeVHGPvVoVy6U6kgY3DoZSfT6izYspDK4aW3lFc1em92moZzWQNLqXK-BT0_6ht-lhOVFFz3P_-dEaAmVSyRAhtBWWwKiBxbA2IaKLUOMpy3ca9GwJZvPgIbQf5LViV6ZK5J0-IzljsA/index.m3u8',
      {
        author: 'hui',
        title: 'pizda',
        duration: 1
      }
    )
    const result = await client.queue.handle(guild, voice.id, text.id, node, [track])
    if (result instanceof BotPlayer) {
      await result.play()
    }

    respond({ content: 'это рофлс' })
  }
}
