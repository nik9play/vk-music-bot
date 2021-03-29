import VKApi from './VKApi'

export default class GetPlaylist extends VKApi {
  async execute(opts) {
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

    const res = await super.sendRequest("execute", {...captchaQuery, code })
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
        return {
          title: e.title,
          author: e.artist,
          url: e.url,
          duration: e.duration
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
}