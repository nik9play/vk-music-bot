import { getUrlDefaultParams, axiosHeaders } from "./settings"
import handleError from "./handleError"

async function audioGetPlaylist(owner_id, album_id, count, offset, access_key, captcha, http) {
  let urlSearch = getUrlDefaultParams()

  if (captcha) {
    urlSearch.append("captcha_sid", captcha.sid)
    urlSearch.append("captcha_key", captcha.key)
  }
  if (access_key) {
    urlSearch.append("access_key", access_key)
  }

  const execString = `var playlistInfoAPI = API.audio.getPlaylistById({
  owner_id: ${owner_id},
  playlist_id: ${album_id},
  ${access_key ? `access_key: '${access_key}',` : ""}
});

var playlistListAPI = API.audio.get({
  owner_id: ${owner_id},
  playlist_id: ${album_id},
  ${access_key ? `access_key: '${access_key}',` : ""}
  ${offset ? `offset: ${offset},` : ""}
  ${count ? `count: ${count},` : ""}
});

var data = {
  'info': playlistInfoAPI,
  'list': playlistListAPI
};
return data;`

  urlSearch.append("code", execString)

  try {
    const req = await http.get(`https://api.vk.com/method/execute`, {
      params: urlSearch,
      headers: axiosHeaders
    })

    if (req.data.error) {
      return handleError(req.data.error)
    } else if (req.data.execute_errors) {
      return {
        status: "error",
        type: "api-error"
      }
    }

    const info = req.data.response.info
    const list = req.data.response.list

    if (list.items.length == 0) {
      return {
        status: "error",
        type: "empty"
      }
    }

    const newArray = list.items.map(e => {
      return {
        title: e.title,
        artist: e.artist,
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
  } catch(err) {
    console.error(err)
    return {
      status: "error",
      type: "request"
    }
  }
}

export { audioGetPlaylist }