import { fetch } from 'undici'

export interface APIResponse {
  status: 'success' | 'error'
  type?: 'api' | 'captcha' | 'empty' | 'access_denied' | 'request'
  error?: any
  data?: any
}

export interface OneTrackResponse {
  status?: 'success' | 'error'
  author: string
  title: string
  url: string
  duration: number
  thumb?: string
  id: string
}

export interface PlaylistInfo {
  title: string
  description: string
  count: number
  imgUrl?: string
}

export interface PlaylistResponse {
  status: 'success' | 'error'
  info: PlaylistInfo
  newArray: OneTrackResponse[]
}

export interface UserInfo {
  type: 'user'
  name: string
  img?: string
}

export interface GroupInfo {
  type: 'group'
  name: string
  description: string
  img?: string
}

export interface UserResponse {
  status: 'success' | 'error'
  info: UserInfo | GroupInfo
  newArray: OneTrackResponse[]
}

export interface ManyTracksResponse {
  status: 'success' | 'error'
  tracks: OneTrackResponse[]
}

export default class VK {
  // constructor (//accessToken = process.env.VK_TOKEN,
  //             //version = '5.116',
  //             //userAgent = "VKAndroidApp/5.52-4543 (Android 5.1.1; SDK 22; x86_64; unknown Android SDK built for x86_64; en; 320x240)"
  //             //userAgent = 'KateMobileAndroid/56 lite-460 (Android 4.4.2; SDK 19; x86; unknown Android SDK built for x86; en)'
  //             )
  // {
  //   // this.accessToken = accessToken
  //   // this.version = version
  //   // this.userAgent = userAgent
  // }

  static async sendRequest(path: string, opts: any): Promise<APIResponse> {
    const urlParams = new URLSearchParams()
    // urlParams.append('v', this.version)
    // urlParams.append('access_token', this.accessToken)

    for (const [key, value] of Object.entries(opts)) {
      urlParams.append(key, value as string)
    }

    try {
      // const res = await axios.get(`${process.env['DATMUSIC_URL']}${path}`, {
      //   params: urlParams
      // })
      const res = await fetch(`${process.env['DATMUSIC_URL']}${path}?${urlParams}`)
      const data = (await res.json()) as any

      if (!res.ok) {
        return {
          status: 'error',
          type: 'request'
        }
      }

      if (data.status === 'error') {
        switch (data.error.code) {
          case 14:
            return {
              status: 'error',
              type: 'captcha',
              error: data.error
            }
          case 201:
            return {
              status: 'error',
              type: 'access_denied'
            }
          case 113:
            return {
              status: 'error',
              type: 'empty'
            }
        }

        return {
          status: 'error',
          type: 'api',
          error: data.error
        }
      }

      return {
        status: 'success',
        data: data.data
      }
    } catch (ex) {
      return {
        status: 'error',
        type: 'request'
      }
    }
  }

  static async tryID(opts: any): Promise<APIResponse | OneTrackResponse> {
    opts.audios = opts.q

    const res = await this.sendRequest('getAudiosById', opts)

    if (res.status === 'error') {
      return res
    } else if (res.data.length === 0) {
      return {
        status: 'error',
        type: 'empty'
      }
    } else {
      const song = res.data[0]

      return {
        status: 'success',
        author: song.artist,
        title: song.title,
        url: song.stream,
        duration: song.duration,
        thumb: song?.cover_url_small
      }
    }
  }

  /**
   * Получить первый трек из поиска либо трек по ID
   */
  static async getOne(opts: any): Promise<APIResponse | OneTrackResponse> {
    if (/^-?[0-9]+_[0-9]+_?[A-Za-z0-9]+$/g.test(opts.q)) {
      return await this.tryID(opts)
    }

    opts.count = 1

    const res = await this.sendRequest('search', opts)

    if (res.status === 'error') {
      return res
    } else if (res.data.length === 0) {
      return {
        status: 'error',
        type: 'empty'
      }
    } else {
      const song = res.data[0]

      return {
        status: 'success',
        author: song.artist,
        title: song.title,
        url: song.stream,
        duration: song.duration,
        thumb: song?.cover_url_small
      }
    }
  }

  /**
   * Получение треков из плейлиста по ID создателя и ID плейлиста
   */
  static async getPlaylist(opts: any): Promise<APIResponse | PlaylistResponse> {
    const res = await this.sendRequest(`albums/${opts.album_id}`, opts)
    if (res.status === 'error') {
      return res
    } else {
      const info = res.data.additionalData
      const list = res.data.data

      if (list.length == 0) {
        return {
          status: 'error',
          type: 'empty'
        }
      }

      const newArray = list.map((e: any): OneTrackResponse => {
        return {
          title: e.title,
          author: e.artist,
          url: e.stream,
          duration: e.duration,
          thumb: e?.cover_url_small,
          id: e.source_id
        }
      })

      let imgUrl
      if (info.photo) {
        imgUrl = info.photo.photo_300
      } else if (info.thumbs) {
        imgUrl = info.thumbs[0].photo_300
      }

      return {
        status: 'success',
        info: {
          title: info.title,
          description: info.description,
          count: info.count,
          imgUrl
        },
        newArray
      }
    }
  }

  /**
   * Получение треков пользователя или группы по ID
   */
  static async getUser(opts: any): Promise<APIResponse | UserResponse> {
    let res

    if (opts.owner_id.startsWith('-')) {
      res = await this.sendRequest(`group/${opts.owner_id.substring(1)}`, opts)
    } else {
      res = await this.sendRequest(`user/${opts.owner_id}`, opts)
    }

    if (res.status === 'error') {
      return res
    } else {
      let info = res.data.additionalData

      if (opts.owner_id.startsWith('-')) {
        info = {
          type: 'group',
          name: info.name,
          description: info.description,
          img: info.photo_200
        } as GroupInfo
      } else {
        info = {
          type: 'user',
          name: `${info.first_name} ${info.last_name}`,
          img: info.photo_200
        } as UserInfo
      }

      const list = res.data.data

      if (list.length == 0) {
        return {
          status: 'error',
          type: 'empty'
        }
      }

      const newArray = list.map((e: any): OneTrackResponse => {
        return {
          title: e.title,
          author: e.artist,
          url: e.stream,
          duration: e.duration,
          thumb: e?.cover_url_small,
          id: e.source_id
        }
      })

      return {
        status: 'success',
        info,
        newArray
      }
    }
  }

  /**
   * Получение 5 треков по запросу
   */
  static async getMany(opts: any): Promise<APIResponse | ManyTracksResponse> {
    opts.count = 5

    const res = await this.sendRequest('search', opts)

    if (res.status === 'error') {
      return res
    } else if (res.data.length === 0) {
      return {
        status: 'error',
        type: 'empty'
      }
    } else {
      return {
        status: 'success',
        tracks: res.data.map((e: any): OneTrackResponse => {
          return {
            author: e.artist,
            title: e.title,
            url: e.stream,
            duration: e.duration,
            thumb: e?.cover_url_small,
            id: e.source_id
          }
        })
      }
    }
  }

  // static async GetWall(opts) {
  //   const res = await this.sendRequest('wall.getById', opts)
  //
  //   if (res.status === 'error') {
  //     return res
  //   } else if (res.data.response.items.length === 0 || !res.data.response.items[0].attachments) {
  //     return {
  //       status: 'error',
  //       type: 'empty'
  //     }
  //   } else {
  //     const attachments = res.data.response.items[0].attachments
  //     return {
  //       status: 'success',
  //       tracks: attachments.map()
  //     }
  //   }
  // }
}
