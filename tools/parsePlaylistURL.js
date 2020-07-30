export default function(url) {
  try {
    url = new URL(url)
  } catch {
    return {
      id: null,
      access_key: null
    }
  }
  
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