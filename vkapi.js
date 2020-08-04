const vkApiLink = "https://api.vk.com/method/audio."
const connectString = `?access_token=${process.env.VK_TOKEN}&v=5.95`

function getUrlDefaultParams() {
  return new URLSearchParams(connectString)
}
const axiosHeaders = {
  "User-Agent": "KateMobileAndroid/56 lite-460 (Android 4.4.2; SDK 19; x86; unknown Android SDK built for x86; en)"
}

// async function audioSearchOne(query, captcha) {
//   console.log(encodeURI(`${vkApiLink}search${connectString}&q=${query}&count=1${captcha ? `&captcha_sid=${captcha.sid}&captcha_key=${captcha.key}` : ``}`))
//   const res = await fetch(encodeURI(`${vkApiLink}search${connectString}&q=${query}&count=1${captcha ? `&captcha_sid=${captcha.sid}&captcha_key=${captcha.key}` : ``}`), {
//     headers: {
//       "User-Agent": "KateMobileAndroid/56 lite-460 (Android 4.4.2; SDK 19; x86; unknown Android SDK built for x86; en)"
//     }
//   })

//   if (res.ok) {
//     const json = await res.json()
    
//     if (!json.error) {
//       if (json.response.count != 0) {
//         return {
//           status: "success",
//           songInfo: {
//             title: json.response.items[0].title,
//             artist: json.response.items[0].artist,
//             url: json.response.items[0].url,
//             duration: json.response.items[0].duration
//           }
//         }
//       } else {

//         const IDres = await fetch(encodeURI(`${vkApiLink}getById${connectString}&audios=${query}`), {
//           headers: {
//             "User-Agent": "KateMobileAndroid/56 lite-460 (Android 4.4.2; SDK 19; x86; unknown Android SDK built for x86; en)"
//           }
//         })

//         const IDjson = await IDres.json()

//         if (IDjson.response) {
//           if (IDjson.response.length > 0) return {
//             status: "success",
//             songInfo: {
//               title: IDjson.response[0].title,
//               artist: IDjson.response[0].artist,
//               url: IDjson.response[0].url,
//               duration: IDjson.response[0].duration
//             }
//           }
//           else return {
//             status: "error",
//             message: "empty-api"
//           }
//         }
//         return {
//           status: "error",
//           message: "empty-api"
//         }
//       }

//     } else {
//       return {
//         status: "error",
//         message: "fail-api",
//         details: json.error
//       }
//     }
//   } else {
//     return {
//       status: "error",
//       message: "fail-fetch"
//     }
//   }
// }

// async function audioGetPlaylввist(owner_id, album_id, count, offset, access_key, captcha) {
//   const res = await fetch(encodeURI(`${vkApiLink}get${connectString}&count=10&offset=${offset - 1}&owner_id=${owner_id}&album_id=${album_id}&count=${count}${captcha ? `&captcha_sid=${captcha.sid}&captcha_key=${captcha.key}` : ``}${access_key ? `&access_key=${access_key}` : ``}`), {
//     headers: {
//       "User-Agent": "KateMobileAndroid/56 lite-460 (Android 4.4.2; SDK 19; x86; unknown Android SDK built for x86; en)"
//     }
//   })

//   if (res.ok) {
//     const json = await res.json()
    
//     if (!json.error) {
//       if (json.response.count != 0) {
//         let newArray = []
//         json.response.items.forEach(e => {
//           newArray.push({
//             title: e.title,
//             artist: e.artist,
//             url: e.url,
//             duration: e.duration
//           })
//         })
  
//         return {
//           status: "success",
//           count: json.response.count,
//           newArray: newArray
//         }
//       } else {
//         return {
//           status: "error",
//           message: "empty-api"
//         }
//       }
//     } else {
//       return {
//         status: "error",
//         message: "fail-api",
//         details: json.error
//       }
//     }
//   } else {
//     return {
//       status: "error",
//       message: "fail-fetch"
//     }
//   }
// }

// async function audioGetUsввer(owner_id, count, offset, captcha) {
//   const res = await fetch(encodeURI(`${vkApiLink}get${connectString}&count=10&offset=${offset - 1}&owner_id=${owner_id}&count=${count}${captcha ? `&captcha_sid=${captcha.sid}&captcha_key=${captcha.key}` : ``}`), {
//     headers: {
//       "User-Agent": "KateMobileAndroid/56 lite-460 (Android 4.4.2; SDK 19; x86; unknown Android SDK built for x86; en)"
//     }
//   })

//   if (res.ok) {
//     const json = await res.json()
    
//     if (!json.error) {
//       if (json.response.count != 0) {
//         let newArray = []
//         json.response.items.forEach(e => {
//           newArray.push({
//             title: e.title,
//             artist: e.artist,
//             url: e.url,
//             duration: e.duration
//           })
//         })
  
//         return {
//           status: "success",
//           count: json.response.count,
//           newArray: newArray
//         }
//       } else {
//         return {
//           status: "error",
//           message: "empty-api"
//         }
//       }
//     } else {
//       return {
//         status: "error",
//         message: "fail-api",
//         details: json.error
//       }
//     }
//   } else {
//     return {
//       status: "error",
//       message: "fail-fetch"
//     }
//   }
// }



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

async function audioGetPlaylist(owner_id, album_id, count, offset, access_key, captcha, http) {
  let urlSearch = getUrlDefaultParams()

  if (captcha) {
    urlSearch.append("captcha_sid", captcha.sid)
    urlSearch.append("captcha_key", captcha.key)
  }
  if (access_key) {
    urlSearch.append("access_key", access_key)
  }

  urlSearch.append("owner_id", owner_id)
  urlSearch.append("album_id", album_id)
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

    if (req.data.response.count == 0) {
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
  } catch(err) {
    console.error(err)
    return {
      status: "error",
      type: "request"
    }
  }
}

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

    if (req.data.response.count == 0) {
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

function handleError(data) {
  if (data.code == 14) {
    return {
      status: "error",
      type: "captcha",
      data
    }
  } else {
    return {
      status: "error",
      type: "api-error"
    }
  }
}

export { audioGetPlaylist, audioGetUser, audioGetOne }