import fetch from 'node-fetch'

const vkApiLink = "https://api.vk.com/method/audio."
const connectString = `?access_token=${process.env.VK_TOKEN}&v=5.95`

async function audioSearchOne(query) {
  const res = await fetch(encodeURI(`${vkApiLink}search${connectString}&q=${query}&count=1`), {
    headers: {
      "User-Agent": "KateMobileAndroid/56 lite-460 (Android 4.4.2; SDK 19; x86; unknown Android SDK built for x86; en)"
    }
  })

  if (res.ok) {
    const json = await res.json()
    
    if (!json.error) {
      if (json.response.count != 0) {
        return {
          status: "success",
          songInfo: {
            title: json.response.items[0].title,
            artist: json.response.items[0].artist,
            url: json.response.items[0].url
          }
        }
      } else {

        const IDres = await fetch(encodeURI(`${vkApiLink}getById${connectString}&audios=${query}`), {
          headers: {
            "User-Agent": "KateMobileAndroid/56 lite-460 (Android 4.4.2; SDK 19; x86; unknown Android SDK built for x86; en)"
          }
        })

        const IDjson = await IDres.json()

        if (IDjson.response) {
          if (IDjson.response.length > 0) return {
            status: "success",
            songInfo: {
              title: IDjson.response[0].title,
              artist: IDjson.response[0].artist,
              url: IDjson.response[0].url
            }
          }
          else return {
            status: "error",
            message: "empty-api"
          }
        }
        return {
          status: "error",
          message: "empty-api"
        }
      }

    } else {
      return {
        status: "error",
        message: "fail-api",
        details: json.error
      }
    }
  } else {
    return {
      status: "error",
      message: "fail-fetch"
    }
  }
}

async function audioGetPlaylist(owner_id, album_id, count, offset) {
  const res = await fetch(encodeURI(`${vkApiLink}get${connectString}&count=10&offset=${offset - 1}&owner_id=${owner_id}&album_id=${album_id}&count=${count}`), {
    headers: {
      "User-Agent": "KateMobileAndroid/56 lite-460 (Android 4.4.2; SDK 19; x86; unknown Android SDK built for x86; en)"
    }
  })

  if (res.ok) {
    const json = await res.json()
    
    if (!json.error) {
      if (json.response.count != 0) {
        let newArray = []
        json.response.items.forEach(e => {
          newArray.push({
            title: e.title,
            artist: e.artist,
            url: e.url
          })
        })
  
        return {
          status: "success",
          count: json.response.count,
          newArray: newArray
        }
      } else {
        return {
          status: "error",
          message: "empty-api"
        }
      }
    } else {
      return {
        status: "error",
        message: "fail-api",
        details: json.error
      }
    }
  } else {
    return {
      status: "error",
      message: "fail-fetch"
    }
  }
}

export { audioSearchOne, audioGetPlaylist }