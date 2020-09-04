import { vkApiLink, getUrlDefaultParams, axiosHeaders } from "./settings"
import handleError from "./handleError"

async function audioSearch(query, captcha, http) {
  let urlSearch = getUrlDefaultParams()

  if (captcha) {
    urlSearch.append("captcha_sid", captcha.sid)
    urlSearch.append("captcha_key", captcha.key)
  }

  urlSearch.append("q", query)
  urlSearch.append("count", 10)

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

    let resultArray = []

    req.data.response.items.map(e => {
      resultArray.push({
        title: e.title,
        artist: e.artist,
        url: e.url,
        duration: e.duration
      })
    })

    return {
      status: "success",
      result: resultArray
    }
  } catch {
    return {
      status: "error",
      type: "request"
    }
  }
}

export { audioSearch }