import parsePlaylistURL from './parsePlaylistURL'

export default function(arg) {
  if (arg.startsWith(">")) {
    return {
      type: "user",
      id: arg.slice(1)
    }
  } else {
    try {
      const url = new URL(arg)

      if (!url.searchParams.get("z")) {
        if (url.pathname.startsWith("/audios-"))
        return {
          type: "group",
          id: url.pathname.slice(7)
        }

      if (url.pathname.startsWith("/audios"))
        return {
          type: "user",
          id: url.pathname.slice(7)
        }
      }

      const parsedURL = parsePlaylistURL(url)

      return {
        type: "playlist",
        parsedURL
      }
    } catch {
      return {
        type: "track"
      }
    }
  }
}