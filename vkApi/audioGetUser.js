import { vkApiLink, getUrlDefaultParams, axiosHeaders } from "./settings"
import handleError from "./handleError"

async function audioGetUser(owner_id, count, offset, captcha, http) {
  let urlSearch = getUrlDefaultParams()

  if (captcha) {
    urlSearch.append("captcha_sid", captcha.sid)
    urlSearch.append("captcha_key", captcha.key)
  }

  urlSearch.append("owner_id", owner_id)
  urlSearch.append("offset", offset)
  urlSearch.append("count", count)

  try {
    const req = await http.get(`${vkApiLink}get`, {
      params: urlSearch,
      headers: axiosHeaders
    })

    if (req.data.error) {
      return handleError(req.data.error)
    }

    if (req.data.response.items.length == 0) {
      return {
        status: "error",
        type: "empty"
      }
    }

    let newArray = []
    req.data.response.items.forEach(e => {
      newArray.push({
        title: e.title,
        artist: e.artist,
        url: e.url,
        duration: e.duration
      })
    })

    return {
      status: "success",
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