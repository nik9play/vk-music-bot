import axios from 'axios'

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

  static async sendRequest(path, opts) {
    let urlParams = new URLSearchParams()
    // urlParams.append('v', this.version)
    // urlParams.append('access_token', this.accessToken)

    for (const [key, value] of Object.entries(opts)) {
      urlParams.append(key, value)
    }

    try {
      const res = await axios.get(`${process.env['DATMUSIC_URL']}${path}`, {
        params: urlParams
      })

      if (res.data.status === 'error') {
        switch(res.data.error.code) {
          case 14:
            return {
              status: 'error',
              type: 'captcha',
              error: res.data.error
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
          error: res.data.error
        }
      }

      return {
        status: 'success',
        data: res.data.data
      }
    } catch (ex) {
      return {
        status: 'error',
        type: 'request'
      }
    }
  }

  static async tryID(opts) {
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
   * @param {Object} opts Параметры запроса
   * @returns {Object[]} Трек
   */
   static async GetOne(opts) {
    if (/^-?[0-9]+_[0-9]+$/g.test(opts.q)) {
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
   * @param {Object} opts Параметры запроса 
   * @returns {Object[]} Массив треков
   */
  static async GetPlaylist(opts) {
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

      const newArray = list.map(e => {
        return {
          title: e.title,
          author: e.artist,
          url: e.stream,
          duration: e.duration,
          thumb: e?.cover_url_small
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
   * @param {Object} opts Параметры запроса 
   * @returns {Object[]} Массив треков
   */
   static async GetUser(opts) {
    let res = null

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
        }
      } else {
        info = {
          type: 'user',
          name: `${info.first_name} ${info.last_name}`,
          img: info.photo_200
        }
      }

      const list = res.data.data

      if (list.length == 0) {
        return {
          status: 'error',
          type: 'empty'
        }
      }

      const newArray = list.map(e => {
        return {
          title: e.title,
          author: e.artist,
          url: e.stream,
          duration: e.duration,
          thumb: e?.cover_url_small
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
   * @param {Object} opts Параметры запроса 
   * @returns {Object[]} Массив треков
   */
   static async GetMany(opts) {
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
        tracks: res.data.map((e) => {
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

  static async GetWall(opts) {
    const res = await this.sendRequest('wall.getById', opts)

    if (res.status === 'error') {
      return res
    } else if (res.data.response.items.length === 0 || !res.data.response.items[0].attachments) {
      return {
        status: 'error',
        type: 'empty'
      }
    } else {
      const attachments = res.data.response.items[0].attachments
      return {
        status: 'success',
        tracks: attachments.map()
      }
    }
  }
}