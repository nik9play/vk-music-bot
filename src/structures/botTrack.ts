import { Track } from 'shoukaku'

type VkTrackInfo = {
  author: string
  title: string
  duration: number
  thumb?: string
  id?: number
  ownerId?: number
  accessKey?: string
}

export default class BotTrack {
  loadedTrack?: Track
  identifier?: string
  vkTrackInfo?: VkTrackInfo
  sourceNameCode: string
  isErrored: boolean = false

  get author() {
    return this.vkTrackInfo
      ? this.vkTrackInfo.author
      : this.loadedTrack?.info.author ?? 'Без автора'
  }

  get title() {
    return this.vkTrackInfo ? this.vkTrackInfo.title : this.loadedTrack?.info.title ?? 'Без имени'
  }

  get duration() {
    return this.vkTrackInfo ? this.vkTrackInfo.duration * 1000 : this.loadedTrack?.info.length ?? 0
  }

  get thumb() {
    return this.vkTrackInfo?.thumb
  }

  get vkFullId() {
    if (this.vkTrackInfo?.id && this.vkTrackInfo?.ownerId) {
      return `${this.vkTrackInfo.ownerId}_${this.vkTrackInfo.id}`
    }
  }

  get uri() {
    if (this.vkTrackInfo)
      return `https://vk.com/audio${this.vkFullId}${
        this.vkTrackInfo.accessKey ? '_' + this.vkTrackInfo.accessKey : ''
      }`
    else return this.loadedTrack?.info.uri
  }

  constructor(
    sourceNameCode: string,
    loadedTrack?: Track,
    identifier?: string,
    vkTrackInfo?: VkTrackInfo
  ) {
    this.sourceNameCode = sourceNameCode

    if (loadedTrack) {
      this.loadedTrack = loadedTrack
      // this.vkTrackInfo = {
      //   author: this.loadedTrack.info.author,
      //   title: this.loadedTrack.info.author,
      //   duration: this.loadedTrack.info.length
      // }
      return
    }

    if (identifier && vkTrackInfo) {
      this.identifier = identifier
      this.vkTrackInfo = vkTrackInfo
    }
  }
}
