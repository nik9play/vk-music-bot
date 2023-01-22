import { KazagumoError, KazagumoQueue } from 'kazagumo'

export default class CustomQueue extends KazagumoQueue {
  public remove(position: number, endPosition?: number): CustomQueue {
    console.log('custom queue')
    if (position < 0 || position >= this.length)
      throw new KazagumoError(1, 'Position must be between 0 and ' + (this.length - 1))

    let endCount = 1
    if (endPosition) {
      if (endPosition < 0) throw new KazagumoError(1, 'End position must be greater than 0')
      if (endPosition < position) throw new KazagumoError(1, 'End position must be greater than start position')
      endCount = position - endPosition + 1
    }

    this.splice(position, endCount)
    return this
  }
}
