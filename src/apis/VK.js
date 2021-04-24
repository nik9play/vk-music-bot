import axios from 'axios'
import convertMP3 from '../tools/convertMP3'

export default class VK {
  async sendRequest(path, opts) {
    let urlParams = new URLSearchParams()
    urlParams.append("v", "5.116")
    urlParams.append("access_token", process.env.VK_TOKEN)

    for (const [key, value] of Object.entries(opts)) {
      urlParams.append(key, value)
    }

    try {
      const res = await axios.get(`https://api.vk.com/method/${path}`, {
        headers: {
          "User-Agent": "VKAndroidApp/5.52-4543 (Android 5.1.1; SDK 22; x86_64; unknown Android SDK built for x86_64; en; 320x240)"
        },
        params: urlParams
      })

      if (res.data.error) {
        if (res.data.error.error_code == 14) {
          return {
            status: "error",
            type: "captcha",
            data: res.data.error
          }
        }

        return {
          status: "error",
          type: "api"
        }
      } else if (res.data.execute_errors)
        return {
          status: "error",
          type: "api"
        }

      return {
        status: "success",
        data: res.data
      }
    } catch {
      return {
        status: "error",
        type: "request"
      }
    }
  }

  async tryID(opts) {
    const captchaQuery = {}

    if (opts.captcha_sid && opts.captcha_key) {
      captchaQuery.captcha_sid = opts.captcha_sid
      captchaQuery.captcha_key = opts.captcha_key
    }

    opts = {...captchaQuery, audios: opts.q}
    const res = await this.sendRequest("audio.getById", opts)

    if (res.status === "error") {
      return res
    } else {
      let thumb = null

      if (res.data.response[0].album) 
        if (res.data.response[0].album.thumb)
          thumb = res.data.response[0].album.thumb.photo_300

      return {
        status: "success",
        author: res.data.response[0].artist,
        title: res.data.response[0].title,
        url: convertMP3(res.data.response[0].url),
        duration: res.data.response[0].duration,
        thumb
      }
    }
  }

  /**
   * Получить первый трек из поиска либо трек по ID
   * @param opts Параметры запроса
   * @returns Трек
   */
  async GetOne(opts) {
    if (/^-?[0-9]+_[0-9]+$/g.test(opts.q)) {
      return await this.tryID(opts)
    }

    opts.count = 1

    const res = await this.sendRequest("audio.search", opts)

    if (res.status === "error") {
      return res
    } else if (res.data.response.items.length === 0) {
      return {
        status: "error",
        type: "empty"
      }
    } else {
      let thumb = null

      if (res.data.response.items[0].album) 
        if (res.data.response.items[0].album.thumb)
          thumb = res.data.response.items[0].album.thumb.photo_300

      return {
        status: "success",
        author: res.data.response.items[0].artist,
        title: res.data.response.items[0].title,
        url: convertMP3(res.data.response.items[0].url),
        duration: res.data.response.items[0].duration,
        thumb
      }
    }
  }

  /**
   * Получение треков из плейлиста по ID создателя и ID плейлиста
   * @param opts Параметры запроса 
   * @returns Массив треков
   */
  async GetPlaylist(opts) {
    const code = `var playlistInfoAPI = API.audio.getPlaylistById({
      owner_id: ${opts.owner_id},
      playlist_id: ${opts.album_id},
      ${opts.access_key ? `access_key: '${opts.access_key}',` : ""}
    });
    
    var playlistListAPI = API.audio.get({
      owner_id: ${opts.owner_id},
      playlist_id: ${opts.album_id},
      ${opts.access_key ? `access_key: '${opts.access_key}',` : ""}
      ${opts.offset ? `offset: ${opts.offset},` : ""}
      ${opts.count ? `count: ${opts.count},` : ""}
    });
    
    var data = {
      'info': playlistInfoAPI,
      'list': playlistListAPI
    };
    return data;`

    const captchaQuery = {}

    if (opts.captcha_sid && opts.captcha_key) {
      captchaQuery.captcha_sid = opts.captcha_sid
      captchaQuery.captcha_key = opts.captcha_key
    }

    const res = await this.sendRequest("execute", {...captchaQuery, code })
    if (res.status === "error") {
      return res
    } else {
      const info = res.data.response.info
      const list = res.data.response.list

      if (list.items.length == 0) {
        return {
          status: "error",
          type: "empty"
        }
      }

      const newArray = list.items.map(e => {
        let thumb = null

        if (e.album) 
          if (e.album.thumb.photo_300)
            thumb = e.album.thumb.photo_300

        return {
          title: e.title,
          author: e.artist,
          url: convertMP3(e.url),
          duration: e.duration,
          thumb
        }
      })

      let imgUrl
      if (info.photo) {
        imgUrl = info.photo.photo_300
      } else if (info.thumbs) {
        imgUrl = info.thumbs[0].photo_300
      }

      return {
        status: "success",
        info: {
          title: info.title,
          description: info.description,
          count: list.count,
          imgUrl
        },
        newArray
      }
    }
  }

  /**
   * Получение треков пользователя или группы по ID
   * @param opts Параметры запроса 
   * @returns Массив треков
   */
  async GetUser(opts) {
    let code = ""

    if (opts.owner_id.startsWith("-")) {
      code = `var groupInfoAPI = API.groups.getById({
        group_ids: "${opts.owner_id.slice(1)}",
        fields: "description"
      })[0];
      
      var listAPI = API.audio.get({
        owner_id: ${opts.owner_id},
        count: ${opts.count},
        offset: ${opts.offset}
      });
      
      var data = {
        'info': groupInfoAPI,
        'list': listAPI
      };
      return data;`
    } else {
      code = `var userInfoAPI = API.users.get({
        user_ids: "${opts.owner_id}",
        fields: "photo_200"
      })[0];
      
      var listAPI = API.audio.get({
        owner_id: userInfoAPI["id"],
        count: ${opts.count},
        offset: ${opts.offset}
      });
      
      var data = {
        'info': userInfoAPI,
        'list': listAPI
      };
      return data;`
    }

    const captchaQuery = {}

    if (opts.captcha_sid && opts.captcha_key) {
      captchaQuery.captcha_sid = opts.captcha_sid
      captchaQuery.captcha_key = opts.captcha_key
    }

    const res = await this.sendRequest("execute", {...captchaQuery, code })

    if (res.status === "error") {
      return res
    } else {
      let info = res.data.response.info

      if (opts.owner_id.startsWith("-")) {
        info = {
          type: "group",
          name: info.name,
          description: info.description,
          img: info.photo_200
        }
      } else {
        info = {
          type: "user",
          name: `${info.first_name} ${info.last_name}`,
          img: info.photo_200
        }
      }

      const list = res.data.response.list

      if (list.items.length == 0) {
        return {
          status: "error",
          type: "empty"
        }
      }

      const newArray = list.items.map(e => {
        let thumb = null

        if (e.album) 
          if (e.album.thumb.photo_300)
            thumb = e.album.thumb.photo_300

        return {
          title: e.title,
          author: e.artist,
          url: convertMP3(e.url),
          duration: e.duration,
          thumb
        }
      })

      return {
        status: "success",
        info,
        newArray
      }
    }
  }

  /**
   * Получение 5 треков по запросу
   * @param opts Параметры запроса 
   * @returns Массив треков
   */
  async GetMany(opts) {
    opts.count = 5

    const res = await this.sendRequest("audio.search", opts)

    if (res.status === "error") {
      return res
    } else if (res.data.response.items.length === 0) {
      return {
        status: "error",
        type: "empty"
      }
    } else {
      return {
        status: "success",
        tracks: res.data.response.items.map((e) => {
          let thumb = null

          if (e.album) 
            if (e.album.thumb.photo_300)
              thumb = e.album.thumb.photo_300

          return {
            author: e.artist,
            title: e.title,
            url: convertMP3(e.url),
            duration: e.duration,
            thumb
          }
        })
      }
    }
  }
}