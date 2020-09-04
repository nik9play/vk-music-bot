import { vkApiLink, axiosHeaders, getUrlDefaultParams } from "./settings"
import handleError from "./handleError"

async function tryID(query, http, urlSearch) {
  urlSearch.append("audios", query)

  try {
    const req = await http.get(`${vkApiLink}getById`, {
      params: urlSearch,
      headers: axiosHeaders
    })

    if (req.data.error) {
      return handleError(req.data.error)
    }

    if (req.data.response.length == 0) {
      return {
        status: "error",
        type: "empty"
      }
    }

    return {
      status: "success",
      songInfo: {
        title: req.data.response[0].title,
        artist: req.data.response[0].artist,
        url: req.data.response[0].url,
        duration: req.data.response[0].duration
      }
    } 
  } catch {
    return {
      status: "error",
      type: "request"
    }
  }
}

async function audioGetOne(query, captcha, http) {
  let urlSearch = getUrlDefaultParams()

  if (captcha) {
    urlSearch.append("captcha_sid", captcha.sid)
    urlSearch.append("captcha_key", captcha.key)
  }

  if (/^[0-9]+_[0-9]+$/g.test(query)) {
    return await tryID(query, http, urlSearch)
  }

  urlSearch.append("q", query)
  urlSearch.append("count", 1)

  try {
    const req = await http.get(`${vkApiLink}search`, {
      params: urlSearch,
      headers: axiosHeaders
    })
  
    if (req.data.error) {
      return handleError(req.data.error)
    }
  
    if (req.data.response.count == 0) {
      return {
        status: "error",
        type: "empty"
      }
    }

    return {
      status: "success",
      songInfo: {
        title: req.data.response.items[0].title,
        artist: req.data.response.items[0].artist,
        url: req.data.response.items[0].url,
        duration: req.data.response.items[0].duration
      }
    } 
  } catch {
    return {
      status: "error",
      type: "request"
    }
  }
}

export { audioGetOne }