export default function(url) {
  if (url.pathname.includes("/music/playlist/") || url.pathname.includes("/music/album/")) {
    const query = url.pathname.split("/")[3]
    let id = null, access_key = null

    if (query) {
      const queryArr = query.split("_")

      id = `${queryArr[0]}_${queryArr[1]}`
      access_key = queryArr[2]
    }

    return {
      id,
      access_key
    }
  } else {
    const query = url.searchParams.get("z")
    let id = null, access_key = null

    if (query) {
      id = query.split("/")[0].replace("audio_playlist", "")
      access_key = query.split("/")[1]
    }
  
    return {
      id,
      access_key
    }
  }
}