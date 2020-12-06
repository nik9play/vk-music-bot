import { getUrlDefaultParams, axiosHeaders } from "./settings"
import handleError from "./handleError"

async function audioGetUser(owner_id, count, offset, captcha, http) {
  let urlSearch = getUrlDefaultParams()

  if (captcha) {
    urlSearch.append("captcha_sid", captcha.sid)
    urlSearch.append("captcha_key", captcha.key)
  }

  const execString = `var userInfoAPI = API.users.get({
    user_ids: "${owner_id}",
    fields: "photo_200"
  })[0];
  
  var listAPI = API.audio.get({
    owner_id: userInfoAPI["id"],
    count: ${count},
    offset: ${offset}
  });
  
  var data = {
    'info': userInfoAPI,
    'list': listAPI
  };
  return data;`

  urlSearch.append("code", execString)

  // urlSearch.append("owner_id", owner_id)
  // urlSearch.append("offset", offset)
  // urlSearch.append("count", count)

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

    return {
      status: "success",
      info: {
        name: `${info.first_name} ${info.last_name}`,
        img: info.photo_200
      },
      newArray
    }
  } catch {
    return {
      status: "error",
      type: "request"
    }
  }
}

export { audioGetUser }