import { Track } from 'shoukaku'

type VkTrackInfo = {
  author: string
  title: string
  duration: number
  thumb?: string
  id?: number
  owner_id?: number
  access_key?: string
}

export default class BotTrack {
  loadedTrack?: Track
  identifier?: string
  vkTrackInfo?: VkTrackInfo

  get author() {
    return this.vkTrackInfo ? this.vkTrackInfo.author : this.loadedTrack?.info.author ?? ''
  }

  get title() {
    return this.vkTrackInfo ? this.vkTrackInfo.title : this.loadedTrack?.info.title ?? ''
  }

  get duration() {
    return this.vkTrackInfo ? this.vkTrackInfo.duration * 1000 : this.loadedTrack?.info.length ?? 0
  }

  get thumb() {
    return this.vkTrackInfo?.thumb
  }

  get vkFullId() {
    if (this.vkTrackInfo?.id && this.vkTrackInfo?.owner_id) {
      return `${this.vkTrackInfo.owner_id}_${this.vkTrackInfo.id}`
    }
  }

  constructor(loadedTrack?: Track, identifier?: string, vkTrackInfo?: VkTrackInfo) {
    if (loadedTrack) {
      this.loadedTrack = loadedTrack
      this.vkTrackInfo = {
        author: this.loadedTrack.info.author,
        title: this.loadedTrack.info.author,
        duration: this.loadedTrack.info.length
      }
      return
    }

    if (identifier && vkTrackInfo) {
      this.identifier = identifier
      this.vkTrackInfo = vkTrackInfo
    }
  }
}
