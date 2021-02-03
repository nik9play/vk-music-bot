import parsePlaylistURL from './parsePlaylistURL'

export default function(arg) {
  if (arg.startsWith(">")) {
    return {
      type: "user"
    }
  } else {
    try {
      const url = new URL(arg)

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