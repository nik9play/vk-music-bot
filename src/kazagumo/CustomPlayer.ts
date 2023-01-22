import { Kazagumo, KazagumoError, KazagumoPlayer, KazagumoPlayerOptions, PlayerState } from 'kazagumo'
import { Player } from 'shoukaku'

export default class CustomPlayer extends KazagumoPlayer {
  constructor(kazagumo: Kazagumo, player: Player, options: KazagumoPlayerOptions, customData: unknown) {
    super(kazagumo, player, options, customData)
  }

  public skip(count?: number): CustomPlayer {
    if (this.state === PlayerState.DESTROYED) throw new KazagumoError(1, 'Player is already destroyed')

    if (count) {
      if (count < 1) throw new KazagumoError(1, 'Count must be greater than 1')

      this.queue.splice(0, count - 1)
    }

    this.shoukaku.stopTrack()

    return this
  }
}
